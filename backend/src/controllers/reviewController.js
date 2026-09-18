const Screening = require('../models/Screening');
const { getDBStatus } = require('../config/db');

/**
 * Updates human review sub-document without altering original MATLAB predictions.
 */
const submitReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewer, decision, notes } = req.body;

    if (!reviewer || !decision) {
      return res.status(400).json({
        status: 'FAILED',
        error: 'Please provide both "reviewer" and "decision" fields.',
      });
    }

    const dbStatus = getDBStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        status: 'FAILED',
        error: 'Database is currently unavailable.',
        dbStatus: 'UNAVAILABLE',
      });
    }

    const screening = await Screening.findOne({ screeningId: id });
    if (!screening) {
      return res.status(404).json({
        status: 'FAILED',
        error: `Screening record ${id} not found.`,
      });
    }

    // Update ONLY humanReview subdocument. Original MATLAB predictions are strictly preserved.
    screening.humanReview = {
      reviewed: true,
      reviewer: String(reviewer),
      decision: String(decision),
      notes: notes ? String(notes) : '',
      reviewedAt: new Date(),
    };

    await screening.save();
    console.log(`[REVIEW CONTROLLER] Human review recorded for screening ${id} by ${reviewer}`);

    res.json({
      status: 'SUCCESS',
      message: 'Human review submitted successfully. Original MATLAB predictions remain unchanged.',
      screening,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitReview,
};
