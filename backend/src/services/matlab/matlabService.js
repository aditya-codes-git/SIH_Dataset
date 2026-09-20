const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { runMatlabScreening } = require('./matlabRunner');

class MatlabService {
  /**
   * High level service method to run DR screening on an uploaded image file
   *
   * @param {string} inputImagePath Absolute path of uploaded image file
   * @param {string} screeningId Unique screening ID
   * @returns {Promise<Object>} Formatted screening output object with exact MATLAB model values
   */
  async runScreening(inputImagePath, screeningId = uuidv4()) {
    const uploadsDir = path.resolve(__dirname, '../../../uploads');
    const outputJsonPath = path.join(uploadsDir, 'results', `${screeningId}_result.json`);
    const gradcamPath = path.join(uploadsDir, 'gradcam', `${screeningId}_gradcam.png`);

    const runnerResult = await runMatlabScreening(inputImagePath, outputJsonPath, gradcamPath);

    if (runnerResult.status !== 'SUCCESS') {
      throw new Error(runnerResult.error || 'MATLAB execution failed');
    }

    const matlabData = runnerResult.rawResult;

    // Preserving exact MATLAB outputs without modification or recalculation
    const screeningResult = {
      screeningId,
      status: matlabData.status,
      quality: {
        gradable: Boolean(matlabData.quality?.gradable),
        reason: String(matlabData.quality?.reason || ''),
        focusScore: Number(matlabData.quality?.focusScore || 0),
        brightness: Number(matlabData.quality?.brightness || 0),
        fovRatio: Number(matlabData.quality?.fovRatio || 0),
      },
    };

    if (matlabData.status === 'UNGRADABLE') {
      screeningResult.message = matlabData.message || 'Please recapture the retinal image.';
      screeningResult.drGrade = null;
      screeningResult.predictedClass = null;
      screeningResult.confidence = null;
      screeningResult.referable = null;
      screeningResult.referral = null;
      screeningResult.gradcamUrl = null;
    } else {
      // GRADABLE status - copy authoritative MATLAB outputs
      screeningResult.drGrade = Number(matlabData.grade);
      screeningResult.predictedClass = String(matlabData.predictedClass);
      screeningResult.confidence = Number(matlabData.confidence);
      screeningResult.referable = Boolean(matlabData.referable);
      screeningResult.referral = String(matlabData.referral);
      screeningResult.gradcamUrl = `/api/files/gradcam/${screeningId}_gradcam.png`;

      // Optional Phase 3 additive fields
      if (matlabData.probabilities) {
        screeningResult.probabilities = matlabData.probabilities;
      }
      if (matlabData.rawConfidence !== undefined) {
        screeningResult.rawConfidence = Number(matlabData.rawConfidence);
      }
      if (matlabData.calibratedProbabilities) {
        screeningResult.calibratedProbabilities = matlabData.calibratedProbabilities;
      }
      if (matlabData.calibratedConfidence !== undefined) {
        screeningResult.calibratedConfidence = Number(matlabData.calibratedConfidence);
      }
      if (matlabData.referableRiskProbability !== undefined) {
        screeningResult.referableRiskProbability = Number(matlabData.referableRiskProbability);
      }
      screeningResult.calibration = matlabData.calibration ? {
        calibrated: Boolean(matlabData.calibration.calibrated),
        temperature: matlabData.calibration.temperature ? Number(matlabData.calibration.temperature) : null,
        method: matlabData.calibration.method || null,
        modelVersion: matlabData.calibration.modelVersion || null,
      } : {
        calibrated: false,
        temperature: null,
        method: null,
        modelVersion: null,
      };

      // Additive Phase 5 & 6 Retinal Analysis and Lesion Evidence
      if (matlabData.retinalAnalysis) {
        screeningResult.retinalAnalysis = matlabData.retinalAnalysis;
      }
    }

    return screeningResult;
  }
}

module.exports = new MatlabService();
