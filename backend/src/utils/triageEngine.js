/**
 * SIH26038 Risk Triage Engine
 *
 * Evaluates clinical routing and referral priority based on authoritative MATLAB outputs.
 * CRITICAL RULE: First checks status === 'GRADABLE'. Only then evaluates drGrade (0-4).
 */

function calculateTriage(status, drGrade) {
  if (status !== 'GRADABLE' || drGrade === null || drGrade === undefined) {
    return {
      referralRequired: false,
      priority: 'RECAPTURE_REQUIRED',
      routing: 'RECAPTURE',
      status: 'UNGRADABLE',
      label: 'Recapture Required',
      recommendation: 'Image quality is insufficient for reliable DR screening. Recapture image.',
    };
  }

  const numericGrade = Number(drGrade);

  switch (numericGrade) {
    case 0:
      return {
        referralRequired: false,
        priority: 'ROUTINE',
        routing: 'ROUTINE_FOLLOW_UP',
        status: 'NOT_REQUIRED',
        label: 'Low Risk — Grade 0 (No DR)',
        recommendation: 'Routine annual eye checkup recommended.',
      };

    case 1:
      return {
        referralRequired: false,
        priority: 'ROUTINE',
        routing: 'ROUTINE_FOLLOW_UP',
        status: 'NOT_REQUIRED',
        label: 'Low Risk — Grade 1 (Mild DR)',
        recommendation: 'Routine follow-up in 6-12 months recommended. Maintain glycemic control.',
      };

    case 2:
      return {
        referralRequired: true,
        priority: 'MEDIUM',
        routing: 'OPHTHALMOLOGIST_REVIEW',
        status: 'PENDING_REVIEW',
        label: 'Referable DR — Grade 2 (Moderate DR)',
        recommendation: 'Specialist review recommended. Routed to Ophthalmologist queue (Medium Priority).',
      };

    case 3:
      return {
        referralRequired: true,
        priority: 'HIGH',
        routing: 'OPHTHALMOLOGIST_REVIEW',
        status: 'PENDING_REVIEW',
        label: 'Referable DR — Grade 3 (Severe DR)',
        recommendation: 'Specialist review strongly recommended. Routed to Ophthalmologist queue (High Priority).',
      };

    case 4:
      return {
        referralRequired: true,
        priority: 'URGENT',
        routing: 'OPHTHALMOLOGIST_REVIEW',
        status: 'PENDING_REVIEW',
        label: 'Referable DR — Grade 4 (Proliferative DR)',
        recommendation: 'URGENT specialist review required. Routed to Ophthalmologist queue (Highest Priority).',
      };

    default:
      return {
        referralRequired: false,
        priority: 'ROUTINE',
        routing: 'ROUTINE_FOLLOW_UP',
        status: 'NOT_REQUIRED',
        label: `Grade ${numericGrade}`,
        recommendation: 'Routine follow-up.',
      };
  }
}

module.exports = {
  calculateTriage,
};
