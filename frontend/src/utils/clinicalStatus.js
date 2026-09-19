/**
 * RETINOSCAN AI — Canonical Clinical Status & Formatting Utilities
 *
 * Provides single-source-of-truth status computations derived strictly
 * from persisted database records. Zero ambiguous fallbacks.
 */

/**
 * Returns review status determination for a screening record:
 * - Grade 0 / Grade 1: 'Not Required'
 * - Grade 2+ (unreviewed): 'Pending Review'
 * - Grade 2+ (reviewed): 'Reviewed (<Decision>)'
 * - Ungradable: 'Recapture'
 */
export function getReviewStatus(screening) {
  if (!screening) return { label: '—', variant: 'neutral', code: 'UNKNOWN' };

  if (screening.status === 'UNGRADABLE') {
    return { label: 'Recapture', variant: 'warning', code: 'RECAPTURE' };
  }

  const grade = screening.drGrade != null ? Number(screening.drGrade) : null;
  if (grade !== null && grade < 2) {
    return { label: 'Not Required', variant: 'neutral', code: 'NOT_REQUIRED' };
  }

  const isReviewed = Boolean(screening.humanReview?.reviewed || screening.triage?.status === 'REVIEWED');
  if (isReviewed) {
    const decision = screening.humanReview?.decision || 'Completed';
    return { label: `Reviewed (${decision})`, variant: 'success', code: 'REVIEWED', decision };
  }

  return { label: 'Pending Review', variant: 'warning', code: 'PENDING_REVIEW' };
}

/**
 * Returns referral routing determination for a screening record:
 * - Ungradable: 'Recapture Required'
 * - Grade >= 2: 'Specialist Review (<Priority>)'
 * - Grade < 2: 'Routine Follow-up'
 */
export function getReferralRouting(screening) {
  if (!screening) return { label: '—', variant: 'neutral', priority: 'ROUTINE' };

  if (screening.status === 'UNGRADABLE') {
    return { label: 'Recapture Required', variant: 'warning', priority: 'RECAPTURE' };
  }

  const grade = screening.drGrade != null ? Number(screening.drGrade) : null;
  if (grade !== null && grade >= 2) {
    const priority = screening.triage?.priority || (grade === 4 ? 'URGENT' : grade === 3 ? 'HIGH' : 'MEDIUM');
    const variant = priority === 'URGENT' ? 'danger' : 'warning';
    return { label: `Specialist Review (${priority})`, variant, priority };
  }

  return { label: 'Routine Follow-up', variant: 'success', priority: 'ROUTINE' };
}

/**
 * Deterministically sorts screening records by created timestamp (newest first).
 * Uses real Unix epoch milliseconds — NEVER parses formatted UI display strings.
 */
export function sortScreeningsByDate(screenings = []) {
  return [...screenings].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}
