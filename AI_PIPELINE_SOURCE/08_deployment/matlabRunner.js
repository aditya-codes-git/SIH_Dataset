const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * Invokes the existing MATLAB screening entry point runScreeningFromFile.m
 *
 * CRITICAL RULE: The MATLAB files (drScreen.m, imageQualityCheck.m, runScreeningFromFile.m, trained_dr_model.mat)
 * are READ-ONLY BLACK BOXES and must never be modified.
 *
 * @param {string} inputImagePath Absolute path to original uploaded image
 * @param {string} outputJsonPath Absolute path where MATLAB will write result.json
 * @param {string} gradcamPath Absolute path where MATLAB will export gradcam.png
 * @returns {Promise<Object>} Object containing status, raw output json data, and gradcam path
 */
async function runMatlabScreening(inputImagePath, outputJsonPath, gradcamPath) {
  // Convert Windows backslashes to forward slashes for MATLAB string compatibility
  const normalizedInput = inputImagePath.replace(/\\/g, '/');
  const normalizedOutput = outputJsonPath.replace(/\\/g, '/');
  const normalizedGradcam = gradcamPath.replace(/\\/g, '/');
  const matlabDir = path.resolve(__dirname, '../../../../').replace(/\\/g, '/');

  // Command to run runScreeningFromFile in MATLAB batch mode
  const matlabCommand = `matlab -batch "addpath('${matlabDir}'); runScreeningFromFile('${normalizedInput}', '${normalizedOutput}', '${normalizedGradcam}');"`;

  console.log(`[MATLAB RUNNER] Executing MATLAB CLI...`);
  console.log(`[MATLAB RUNNER] Command: ${matlabCommand}`);

  return new Promise((resolve, reject) => {
    // 3 minute timeout for MATLAB execution if model loading takes time
    exec(matlabCommand, { timeout: 180000, cwd: matlabDir }, async (error, stdout, stderr) => {
      if (stdout) console.log(`[MATLAB STDOUT]:\n${stdout}`);
      if (stderr) console.warn(`[MATLAB STDERR]:\n${stderr}`);

      if (error) {
        console.error(`[MATLAB RUNNER ERROR] Child process execution failed: ${error.message}`);
        return reject({
          status: 'FAILED',
          error: `MATLAB execution failed: ${error.message}`,
          details: stderr || stdout
        });
      }

      // Check if output JSON file was created
      try {
        const jsonExists = await fs.access(outputJsonPath).then(() => true).catch(() => false);
        if (!jsonExists) {
          console.error(`[MATLAB RUNNER ERROR] MATLAB finished but result JSON not found at ${outputJsonPath}`);
          return reject({
            status: 'FAILED',
            error: `MATLAB output JSON was not generated. Check MATLAB console output.`,
            details: stdout
          });
        }

        const rawJsonText = await fs.readFile(outputJsonPath, 'utf8');
        const parsedResult = JSON.parse(rawJsonText);
        console.log(`[MATLAB RUNNER SUCCESS] Result received:`, parsedResult);

        resolve({
          status: 'SUCCESS',
          rawResult: parsedResult,
          jsonPath: outputJsonPath,
          gradcamPath: gradcamPath
        });
      } catch (err) {
        console.error(`[MATLAB RUNNER ERROR] Failed to read MATLAB result JSON: ${err.message}`);
        reject({
          status: 'FAILED',
          error: `Failed to read MATLAB output JSON: ${err.message}`
        });
      }
    });
  });
}

module.exports = { runMatlabScreening };
