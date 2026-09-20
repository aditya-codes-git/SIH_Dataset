const path = require('path');

/**
 * Role-Based Payload Sanitizer
 *
 * Enforces server-side data privacy boundaries.
 * Operators receive patient profile, quality reasons, DR grade, and risk triage outcome
 * necessary to complete camp routing.
 * Doctors receive full clinical payload (including Doctor notes, review form, Grad-CAM, AI assistant).
 */

function sanitizeScreening(screening, role) {
  if (!screening) return null;

  // Convert Mongoose Document to plain JS object if needed
  const doc = typeof screening.toObject === 'function' ? screening.toObject() : { ...screening };

  const originalFilename = doc.originalImagePath ? path.basename(doc.originalImagePath) : `${doc.screeningId}.png`;
  const gradcamFilename = doc.gradcamImagePath || `${doc.screeningId}_gradcam.png`;

  if (role === 'operator') {
    return {
      screeningId: doc.screeningId,
      patientId: doc.patientId || 'PATIENT-ANONYMOUS',
      patientName: doc.patientName || 'Anonymous Patient',
      age: doc.age || null,
      gender: doc.gender || 'Unspecified',
      diabetesDuration: doc.diabetesDuration || 'Not specified',
      contactLocation: doc.contactLocation || 'Rural Health Camp',
      status: doc.status,
      quality: {
        gradable: Boolean(doc.quality?.gradable),
        reason: String(doc.quality?.reason || ''),
        focusScore: doc.quality?.focusScore,
        brightness: doc.quality?.brightness,
        fovRatio: doc.quality?.fovRatio,
      },
      drGrade: doc.drGrade,
      predictedClass: doc.predictedClass || (doc.drGrade != null ? String(doc.drGrade) : null),
      confidence: doc.confidence != null ? Number(doc.confidence) : null,
      rawConfidence: doc.rawConfidence != null ? Number(doc.rawConfidence) : (doc.confidence != null ? Number(doc.confidence) : null),
      calibratedConfidence: doc.calibratedConfidence != null ? Number(doc.calibratedConfidence) : null,
      referableRiskProbability: doc.referableRiskProbability != null ? Number(doc.referableRiskProbability) : null,
      probabilities: doc.probabilities || undefined,
      calibratedProbabilities: doc.calibratedProbabilities || undefined,
      calibration: doc.calibration || undefined,
      referable: doc.referable ?? (doc.drGrade !== null && doc.drGrade >= 2),
      referral: doc.referral || (doc.drGrade !== null && doc.drGrade >= 2 ? 'Referable DR' : 'Non-Referable'),
      triage: doc.triage || {
        referralRequired: Boolean(doc.drGrade !== null && doc.drGrade >= 2),
        priority: doc.drGrade >= 2 ? (doc.drGrade === 4 ? 'URGENT' : doc.drGrade === 3 ? 'HIGH' : 'MEDIUM') : 'ROUTINE',
        routing: doc.drGrade >= 2 ? 'OPHTHALMOLOGIST_REVIEW' : 'ROUTINE_FOLLOW_UP',
        status: doc.humanReview?.reviewed ? 'REVIEWED' : doc.drGrade >= 2 ? 'PENDING_REVIEW' : 'NOT_REQUIRED',
      },
      humanReview: {
        reviewed: Boolean(doc.humanReview?.reviewed),
        reviewer: doc.humanReview?.reviewer || null,
        decision: doc.humanReview?.decision || null,
        notes: doc.humanReview?.notes || null,
        clinicalFindings: doc.humanReview?.clinicalFindings || null,
        recommendations: doc.humanReview?.recommendations || null,
        reviewedAt: doc.humanReview?.reviewedAt || null,
      },
      message: doc.message || null,
      originalImageUrl: doc.originalImageUrl || `/api/files/original/${originalFilename}`,
      gradcamUrl: doc.gradcamUrl || `/api/files/gradcam/${gradcamFilename}`,
      retinalAnalysis: doc.retinalAnalysis || undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  // Doctor role gets full clinical payload
  return {
    ...doc,
    confidence: doc.confidence != null ? Number(doc.confidence) : null,
    rawConfidence: doc.rawConfidence != null ? Number(doc.rawConfidence) : (doc.confidence != null ? Number(doc.confidence) : null),
    calibratedConfidence: doc.calibratedConfidence != null ? Number(doc.calibratedConfidence) : null,
    referableRiskProbability: doc.referableRiskProbability != null ? Number(doc.referableRiskProbability) : null,
    originalImageUrl: doc.originalImageUrl || `/api/files/original/${originalFilename}`,
    gradcamUrl: doc.gradcamUrl || `/api/files/gradcam/${gradcamFilename}`,
    retinalAnalysis: doc.retinalAnalysis || undefined,
  };
}

function sanitizeScreeningsList(screenings, role) {
  if (!Array.isArray(screenings)) return [];
  return screenings.map((s) => sanitizeScreening(s, role));
}

module.exports = {
  sanitizeScreening,
  sanitizeScreeningsList,
};

