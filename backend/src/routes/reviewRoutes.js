const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');

// POST /api/screenings/:id/review - Submit clinician review (DOCTOR ONLY)
router.post('/:id/review', authenticateUser, authorizeRole('doctor'), reviewController.submitReview);

module.exports = router;
