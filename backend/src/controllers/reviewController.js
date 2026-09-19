const Screening = require('../models/Screening');
const { getDBStatus } = require('../config/db');
const { sanitizeScreening } = require('../utils/roleSanitizer');

/**
 * ATOMIC CLINICIAN REVIEW SUBMISSION
 *
 * Enforces:
 * 1. Case must exist and database must be connected.
 * 2. Case must be GRADABLE (UNGRADABLE cases require recapture, not specialist review).
 * 3. Canonical drGrade must be >= 2 (Grade 0 and Grade 1 are non-referable routine cases).
 * 4. Atomic conditional database update (prevents concurrent race conditions and double submission).
 * 5. Original AI predictions (drGrade, confidence, referable, quality, images) remain strictly immutable.
 * 6. Idempotent return if identical review payload is re-submitted.
 */
const submitReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewer, decision, notes, clinicalFindings, recommendations } = req.body;

    // 1. Validate required submission fields
    if (!reviewer || !String(reviewer).trim() || !decision || !String(decision).trim()) {
      return res.status(400).json({
        status: 'FAILED',
        code: 'VALIDATION_FAILED',
        error: 'Validation failed: Please provide both "reviewer" and "decision" fields.',
      });
    }

    const cleanReviewer = String(reviewer).trim();
    const cleanDecision = String(decision).trim();
    const cleanNotes = notes ? String(notes).trim() : '';
    const cleanFindings = clinicalFindings ? String(clinicalFindings).trim() : '';
    const cleanRecs = recommendations ? String(recommendations).trim() : '';

    // 2. Check Database Availability
    const dbStatus = getDBStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        status: 'FAILED',
        error: 'Database is currently unavailable. Review cannot be persisted.',
        dbStatus: 'UNAVAILABLE',
      });
    }

    // 3. ATOMIC CONDITIONAL UPDATE
    // Updates ONLY if case is GRADABLE, canonical drGrade >= 2, and review is not yet completed.
    const reviewDate = new Date();
    const updatedScreening = await Screening.findOneAndUpdate(
      {
        screeningId: id,
        status: 'GRADABLE',
        drGrade: { $gte: 2 },
        'humanReview.reviewed': { $ne: true },
        'triage.status': { $nin: ['REVIEWED', 'COMPLETED'] },
      },
      {
        $set: {
          'humanReview.reviewed': true,
          'humanReview.reviewer': cleanReviewer,
          'humanReview.decision': cleanDecision,
          'humanReview.notes': cleanNotes,
          'humanReview.clinicalFindings': cleanFindings,
          'humanReview.recommendations': cleanRecs,
          'humanReview.reviewedAt': reviewDate,
          'triage.status': 'REVIEWED',
        },
      },
      {
        new: true, // Return the updated document
        runValidators: true,
      }
    );

    // 4. If atomic update succeeded, return updated persisted case state
    if (updatedScreening) {
      console.log(`[REVIEW CONTROLLER] Successfully recorded atomic review for screening ${id} by ${cleanReviewer} (Decision: ${cleanDecision})`);
      const sanitized = sanitizeScreening(updatedScreening, 'doctor');
      return res.json({
        status: 'SUCCESS',
        message: 'Clinical review persisted successfully. Original AI predictions remain immutable.',
        screening: sanitized,
      });
    }

    // 5. If atomic update did NOT match a document, diagnose the specific reason:
    const existing = await Screening.findOne({ screeningId: id });

    if (!existing) {
      return res.status(404).json({
        status: 'FAILED',
        code: 'NOT_FOUND',
        error: `Screening record "${id}" not found in database.`,
      });
    }

    // Rule: UNGRADABLE cases cannot be reviewed
    if (existing.status !== 'GRADABLE') {
      return res.status(400).json({
        status: 'FAILED',
        code: 'INELIGIBLE_QUALITY',
        error: `Ineligible for clinical review: Image quality status is "${existing.status}". Ungradable cases require fundus image recapture, not specialist review.`,
        screeningId: id,
        status: existing.status,
      });
    }

    // Rule: drGrade must be >= 2
    if (existing.drGrade === null || existing.drGrade === undefined || Number(existing.drGrade) < 2) {
      return res.status(400).json({
        status: 'FAILED',
        code: 'INELIGIBLE_GRADE',
        error: `Ineligible for specialist review: Authoritative AI DR Grade is ${existing.drGrade ?? 'N/A'}. Only referable cases (DR Grade >= 2) may be submitted for specialist review.`,
        screeningId: id,
        drGrade: existing.drGrade,
      });
    }

    // Rule: Concurrency / Already Reviewed Protection
    if (existing.humanReview?.reviewed || existing.triage?.status === 'REVIEWED' || existing.triage?.status === 'COMPLETED') {
      const isSameReviewer = existing.humanReview?.reviewer === cleanReviewer;
      const isSameDecision = existing.humanReview?.decision === cleanDecision;
      const isSameNotes = (existing.humanReview?.notes || '') === cleanNotes;

      // Idempotent return if exact same review was already processed (e.g. network retry or rapid double click)
      if (isSameReviewer && isSameDecision && isSameNotes) {
        console.log(`[REVIEW CONTROLLER] Idempotent retry detected for already-reviewed screening ${id}`);
        const sanitized = sanitizeScreening(existing, 'doctor');
        return res.json({
          status: 'SUCCESS',
          duplicateRetry: true,
          message: 'Review already persisted with identical data.',
          screening: sanitized,
        });
      }

      // Conflict if attempting to overwrite an existing completed review
      return res.status(409).json({
        status: 'FAILED',
        code: 'ALREADY_REVIEWED',
        error: `Conflict: Screening "${id}" has already been reviewed by ${existing.humanReview?.reviewer || 'a clinician'} on ${existing.humanReview?.reviewedAt ? new Date(existing.humanReview.reviewedAt).toLocaleString() : 'record'}. Completed reviews cannot be overwritten.`,
        screeningId: id,
        existingReview: {
          reviewer: existing.humanReview?.reviewer,
          decision: existing.humanReview?.decision,
          reviewedAt: existing.humanReview?.reviewedAt,
        },
      });
    }

    // Fallback error
    return res.status(400).json({
      status: 'FAILED',
      error: `Screening "${id}" could not be updated for clinical review.`,
    });
  } catch (error) {
    console.error('[REVIEW CONTROLLER ERROR]:', error);
    next(error);
  }
};

module.exports = {
  submitReview,
};
