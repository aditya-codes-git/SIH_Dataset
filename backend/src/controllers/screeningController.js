const Screening = require('../models/Screening');
const matlabService = require('../services/matlab/matlabService');
const { getDBStatus } = require('../config/db');
const { sanitizeScreening, sanitizeScreeningsList } = require('../utils/roleSanitizer');
const { calculateTriage } = require('../utils/triageEngine');

/**
 * Handles fundus image upload, passes file path to MATLAB service,
 * computes SIH26038 triage routing, saves authoritative result in MongoDB,
 * and returns role-sanitized JSON to client.
 */
const createScreening = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'FAILED',
        error: 'No image file uploaded. Please provide an image file under the "image" field.',
      });
    }

    const screeningId = req.screeningId;
    const patientId = req.body.patientId || 'PATIENT-ANONYMOUS';
    const patientName = req.body.patientName || 'Anonymous Patient';
    const age = req.body.age ? Number(req.body.age) : null;
    const gender = req.body.gender || 'Unspecified';
    const diabetesDuration = req.body.diabetesDuration || 'Not specified';
    const contactLocation = req.body.contactLocation || 'Rural Screening Camp';

    const originalImagePath = req.file.path;
    const userRole = req.user?.role || 'doctor';

    console.log(`[SCREENING CONTROLLER] Starting screening ${screeningId} for patient ${patientId} (${patientName}) (Role: ${userRole})`);

    // Call MATLAB Service (READ-ONLY BLACK BOX)
    const matlabResult = await matlabService.runScreening(originalImagePath, screeningId);
    const originalImageUrl = `/api/files/original/${req.file.filename}`;

    // Calculate Risk Triage based on status and grade
    const triage = calculateTriage(matlabResult.status, matlabResult.drGrade);

    const rawPayload = {
      screeningId: matlabResult.screeningId,
      patientId,
      patientName,
      age,
      gender,
      diabetesDuration,
      contactLocation,
      originalImagePath,
      status: matlabResult.status,
      quality: matlabResult.quality,
      drGrade: matlabResult.drGrade,
      predictedClass: matlabResult.predictedClass,
      confidence: matlabResult.confidence,
      referable: matlabResult.referable,
      referral: matlabResult.referral,
      triage,
      message: matlabResult.message || null,
      originalImageUrl,
      gradcamUrl: matlabResult.gradcamUrl,
      gradcamImagePath: matlabResult.gradcamUrl ? `${matlabResult.screeningId}_gradcam.png` : null,
      humanReview: {
        reviewed: false,
        reviewer: null,
        decision: null,
        notes: null,
        reviewedAt: null,
      },
      createdAt: new Date().toISOString(),
    };

    // Save full clinical result to MongoDB if DB is connected
    const dbStatus = getDBStatus();
    if (dbStatus.connected) {
      try {
        const screeningDoc = new Screening({
          screeningId: matlabResult.screeningId,
          patientId,
          patientName,
          age,
          gender,
          diabetesDuration,
          contactLocation,
          originalImagePath,
          status: matlabResult.status,
          quality: matlabResult.quality,
          drGrade: matlabResult.drGrade,
          predictedClass: matlabResult.predictedClass,
          confidence: matlabResult.confidence,
          referable: matlabResult.referable,
          referral: matlabResult.referral,
          triage,
          gradcamImagePath: matlabResult.gradcamUrl ? `${matlabResult.screeningId}_gradcam.png` : null,
          message: matlabResult.message || null,
        });

        await screeningDoc.save();
        console.log(`[SCREENING CONTROLLER] Saved full screening ${screeningId} to MongoDB with Triage Priority: ${triage.priority}`);
        rawPayload.dbPersisted = true;
      } catch (dbErr) {
        console.error(`[SCREENING CONTROLLER DB WARNING] Failed to persist to MongoDB: ${dbErr.message}`);
        rawPayload.dbPersisted = false;
      }
    }

    // Sanitize response payload based on user role!
    const sanitized = sanitizeScreening(rawPayload, userRole);
    res.status(201).json(sanitized);
  } catch (error) {
    console.error(`[SCREENING CONTROLLER ERROR]:`, error);
    next(error);
  }
};

/**
 * Returns list of screenings sanitized according to requesting user role
 */
const getScreenings = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'doctor';
    const dbStatus = getDBStatus();

    if (!dbStatus.connected) {
      return res.status(503).json({
        status: 'FAILED',
        error: 'Database is currently unavailable.',
        dbStatus: 'UNAVAILABLE',
      });
    }

    const screenings = await Screening.find().sort({ createdAt: -1 });
    const sanitizedList = sanitizeScreeningsList(screenings, userRole);

    res.json({
      status: 'SUCCESS',
      count: sanitizedList.length,
      screenings: sanitizedList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns single screening record sanitized according to requesting user role
 */
const getScreeningById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || 'doctor';
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
        error: `Screening with ID ${id} not found.`,
      });
    }

    const sanitized = sanitizeScreening(screening, userRole);
    res.json({
      status: 'SUCCESS',
      screening: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createScreening,
  getScreenings,
  getScreeningById,
};
