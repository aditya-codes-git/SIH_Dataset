const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');

// All AI Agent routes require Doctor authorization!
router.use(authenticateUser);
router.use(authorizeRole('doctor'));

// POST /api/agent/explain - Structured explanation of a screening result (DOCTOR ONLY)
router.post('/explain', agentController.explainScreening);

// POST /api/agent/chat - Conversational Q&A on screening context (DOCTOR ONLY)
router.post('/chat', agentController.chatWithAgent);

module.exports = router;
