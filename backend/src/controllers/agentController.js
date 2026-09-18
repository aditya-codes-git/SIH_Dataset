const aiAgentService = require('../services/agent/aiAgentService');
const Screening = require('../models/Screening');
const { getDBStatus } = require('../config/db');

/**
 * Endpoint for structured explanation of a screening result.
 * Expects { screeningId } or screening object in request body.
 */
const explainScreening = async (req, res, next) => {
  try {
    const { screeningId, screeningData } = req.body;
    let screening = screeningData;

    if (!screening && screeningId) {
      const dbStatus = getDBStatus();
      if (dbStatus.connected) {
        screening = await Screening.findOne({ screeningId });
      }
    }

    if (!screening && !screeningId) {
      return res.status(400).json({
        status: 'FAILED',
        error: 'Please provide either "screeningId" or "screeningData" in request body.',
      });
    }

    const result = aiAgentService.explainScreening(screening);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint for conversational Q&A regarding patient screening history, quality, or referral logic.
 * Expects { prompt, screeningId, screeningData } in request body.
 */
const chatWithAgent = async (req, res, next) => {
  try {
    const { prompt, screeningId, screeningData } = req.body;

    if (!prompt) {
      return res.status(400).json({
        status: 'FAILED',
        error: 'Please provide a "prompt" question in the request body.',
      });
    }

    let screening = screeningData;
    if (!screening && screeningId) {
      const dbStatus = getDBStatus();
      if (dbStatus.connected) {
        screening = await Screening.findOne({ screeningId });
      }
    }

    const context = { screening };
    const agentResponse = aiAgentService.chatWithAgent(prompt, context);

    res.json({
      status: 'SUCCESS',
      prompt,
      screeningId: screening?.screeningId || null,
      ...agentResponse,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  explainScreening,
  chatWithAgent,
};
