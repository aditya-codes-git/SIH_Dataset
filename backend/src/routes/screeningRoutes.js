const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const screeningController = require('../controllers/screeningController');
const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');

// Require authenticated user (or demo role) for all screening routes
router.use(authenticateUser);

// POST /api/screenings - Upload image & run MATLAB screening pipeline
router.post('/', upload.single('image'), screeningController.createScreening);

// GET /api/screenings - List screenings (sanitized by role)
router.get('/', screeningController.getScreenings);

// GET /api/screenings/pending-reviews - List ONLY eligible unreviewed Grade 2+ cases (DOCTOR ONLY)
router.get('/pending-reviews', authorizeRole('doctor'), screeningController.getPendingReviews);

// GET /api/screenings/:id - Get single screening (sanitized by role)
router.get('/:id', screeningController.getScreeningById);

module.exports = router;
