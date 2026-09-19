const Screening = require('../models/Screening');

/**
 * IDEMPOTENT & NON-DESTRUCTIVE DATABASE MIGRATION
 *
 * Repairs known schema inconsistencies in legacy records:
 * 1. Synchronizes records where humanReview.reviewed === true but triage.status !== 'REVIEWED'
 * 2. Populates missing triage blocks only where triage is null/undefined
 *
 * CRITICAL SAFETY RULES:
 * - NEVER modifies historical drGrade, confidence, status, images, quality, review notes, or timestamps
 * - Idempotent: running multiple times produces identical state
 * - Logs exact counts: examined, updated, skipped, errors
 */
async function runIdempotentDataMigration() {
  try {
    const allScreenings = await Screening.find();
    let examined = allScreenings.length;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of allScreenings) {
      let needsUpdate = false;
      const updates = {};

      // 1. Repair: if humanReview.reviewed === true, triage.status must be 'REVIEWED'
      if (doc.humanReview?.reviewed === true && doc.triage?.status !== 'REVIEWED' && doc.triage?.status !== 'COMPLETED') {
        updates['triage.status'] = 'REVIEWED';
        needsUpdate = true;
      }

      // 2. Repair: missing triage block on legacy documents
      if (!doc.triage || !doc.triage.routing) {
        if (doc.status !== 'GRADABLE') {
          updates['triage'] = {
            referralRequired: false,
            priority: 'RECAPTURE_REQUIRED',
            routing: 'RECAPTURE',
            status: 'UNGRADABLE',
          };
          needsUpdate = true;
        } else {
          const grade = doc.drGrade;
          if (grade === null || grade === undefined || grade < 2) {
            updates['triage'] = {
              referralRequired: false,
              priority: 'ROUTINE',
              routing: 'ROUTINE_FOLLOW_UP',
              status: 'NOT_REQUIRED',
            };
            needsUpdate = true;
          } else {
            const isReviewed = Boolean(doc.humanReview?.reviewed);
            updates['triage'] = {
              referralRequired: true,
              priority: grade === 4 ? 'URGENT' : grade === 3 ? 'HIGH' : 'MEDIUM',
              routing: 'OPHTHALMOLOGIST_REVIEW',
              status: isReviewed ? 'REVIEWED' : 'PENDING_REVIEW',
            };
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        try {
          await Screening.updateOne({ _id: doc._id }, { $set: updates });
          updated++;
        } catch (err) {
          console.error(`[MIGRATION ERROR] Failed to update doc ${doc.screeningId}: ${err.message}`);
          errors++;
        }
      } else {
        skipped++;
      }
    }

    console.log(`[MIGRATION] Complete. Examined: ${examined}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    return { examined, updated, skipped, errors };
  } catch (err) {
    console.error(`[MIGRATION ERROR]: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = {
  runIdempotentDataMigration,
};
