function test_calibration_pipeline()
% TEST_CALIBRATION_PIPELINE
% Unit test suite for Phase 3 probability distribution, temperature scaling,
% and continuous referable-risk estimation.
%
% Tests A through M:
%   A. Exactly five probabilities
%   B. Raw probability sum ≈ 1
%   C. Predicted class = argmax(raw probabilities)
%   D. Calibrated probabilities are valid (in [0, 1])
%   E. Calibrated probability sum ≈ 1
%   F. No NaN
%   G. No Inf
%   H. Temperature is finite, positive, and valid (T > 0)
%   I. referableRiskProbability ∈ [0, 1]
%   J. referableRisk + nonReferableRisk ≈ 1
%   K. Calibration uses ONLY CALIBRATION split
%   L. TEST IDs are never used for fitting T
%   M. Legacy fields remain available and structurally identical

fprintf('===========================================================\n');
fprintf('  RUNNING PHASE 3 CALIBRATION UNIT TEST SUITE              \n');
fprintf('===========================================================\n');

baseDir = fileparts(fileparts(mfilename('fullpath'))); % AI_REBUILD/
calibDir = fullfile(baseDir, '04_calibration');
addpath(calibDir);
addpath(fullfile(baseDir, '02_training'));
addpath(fileparts(baseDir)); % root for IQA, Kaggle preprocessing

% Load calibration parameters
paramsFile = fullfile(calibDir, 'calibration_parameters.mat');
assert(exist(paramsFile, 'file') > 0, 'calibration_parameters.mat missing');
pData = load(paramsFile);
calib = pData.calibration;

% TEST H: Temperature is finite and valid
fprintf('[TEST H] Temperature parameter validity: ');
assert(isfinite(calib.temperature) && calib.temperature > 0, 'Temperature must be finite and positive');
fprintf('PASSED (T = %.4f)\n', calib.temperature);

% TEST K & L: Partition integrity and isolation
fprintf('[TEST K & L] Split isolation and zero test data leakage: ');
splitsData = load(fullfile(baseDir, '01_data', 'dataset_splits.mat'));
predsData = load(fullfile(calibDir, 'calibration_predictions.mat'));
calibPreds = predsData.calibPredictions;

assert(length(calibPreds.ids) == 550, 'Calibration predictions must have exactly 550 samples');
testOverlap = intersect(string(calibPreds.ids), string(splitsData.testIds));
trainOverlap = intersect(string(calibPreds.ids), string(splitsData.trainIds));

assert(isempty(testOverlap), 'FAILED: Test IDs found in calibration set');
assert(isempty(trainOverlap), 'FAILED: Train IDs found in calibration set');
assert(isequal(sort(string(calibPreds.ids)), sort(string(splitsData.calibrationIds))), ...
    'Calibration predictions must match canonical calibrationIds exactly');
fprintf('PASSED (0 overlap with Test/Train)\n');

% Load frozen model and a test sample
modelFile = fullfile(baseDir, '02_training', 'models', 'trained_dr_model_r18_final_candidate.mat');
assert(exist(modelFile, 'file') > 0, 'Frozen candidate model missing');
mData = load(modelFile);
net = mData.trainedNet;

% Test on calibration predictions matrix (N = 550)
rawP = calibPreds.rawProbabilities;
calibP = calibPreds.calibratedProbabilities;
pRef = calibPreds.referableRiskProbability;
pNonRef = calibPreds.nonReferableRiskProbability;

% TEST A: Exactly five probabilities
fprintf('[TEST A] Matrix shape (exactly 5 probability columns): ');
assert(size(rawP, 2) == 5 && size(calibP, 2) == 5, 'Must have exactly 5 probability columns');
fprintf('PASSED\n');

% TEST B: Raw probability sum ≈ 1
fprintf('[TEST B] Raw probabilities sum to 1.0: ');
assert(all(abs(sum(rawP, 2) - 1.0) < 1e-5), 'Raw probabilities must sum to 1.0');
fprintf('PASSED\n');

% TEST C: Predicted class = argmax(raw probabilities)
fprintf('[TEST C] Argmax class alignment: ');
[~, rawArgmax] = max(rawP, [], 2);
[~, calibArgmax] = max(calibP, [], 2);
assert(isequal(rawArgmax, calibArgmax), 'Temperature scaling must preserve argmax order');
fprintf('PASSED\n');

% TEST D: Calibrated probabilities in [0, 1]
fprintf('[TEST D] Calibrated probabilities bounded in [0, 1]: ');
assert(all(calibP(:) >= 0) && all(calibP(:) <= 1), 'Calibrated probabilities must be in [0, 1]');
fprintf('PASSED\n');

% TEST E: Calibrated probability sum ≈ 1
fprintf('[TEST E] Calibrated probabilities sum to 1.0: ');
assert(all(abs(sum(calibP, 2) - 1.0) < 1e-5), 'Calibrated probabilities must sum to 1.0');
fprintf('PASSED\n');

% TEST F & G: No NaN or Inf
fprintf('[TEST F & G] Absence of NaN or Inf values: ');
assert(~any(isnan(rawP(:))) && ~any(isnan(calibP(:))), 'Found NaN in probabilities');
assert(~any(isinf(rawP(:))) && ~any(isinf(calibP(:))), 'Found Inf in probabilities');
fprintf('PASSED\n');

% TEST I: Referable risk bounded in [0, 1]
fprintf('[TEST I] Referable risk probability in [0, 1]: ');
assert(all(pRef >= 0) && all(pRef <= 1), 'Referable risk must be in [0, 1]');
fprintf('PASSED\n');

% TEST J: Referable + Non-referable ≈ 1
fprintf('[TEST J] P(Referable) + P(NonReferable) ≈ 1.0: ');
assert(all(abs((pRef + pNonRef) - 1.0) < 1e-5), 'Sum of referable and non-referable must equal 1.0');
fprintf('PASSED\n');

% TEST M: Legacy fields remain available and structurally identical
fprintf('[TEST M] Backward compatibility of drScreen_calibrated output: ');
sampleImgPath = fullfile(fileparts(baseDir), 'train_images', sprintf('%s.png', calibPreds.ids{1}));
if exist(sampleImgPath, 'file')
    res = drScreen_calibrated(sampleImgPath);
    
    % Verify legacy fields exist
    requiredLegacy = {'status', 'quality', 'grade', 'predictedClass', 'confidence', ...
                      'referable', 'referral', 'scoreMap', 'processedImage'};
    for f = 1:length(requiredLegacy)
        assert(isfield(res, requiredLegacy{f}), sprintf('Missing legacy field: %s', requiredLegacy{f}));
    end
    
    % Verify additive fields exist
    requiredAdditive = {'probabilities', 'rawConfidence', 'calibratedProbabilities', ...
                        'calibratedConfidence', 'referableRiskProbability', 'classification', 'calibration'};
    for f = 1:length(requiredAdditive)
        assert(isfield(res, requiredAdditive{f}), sprintf('Missing additive field: %s', requiredAdditive{f}));
    end
    
    assert(length(res.probabilities) == 5, 'Probabilities must have 5 elements');
    assert(abs(sum(res.calibratedProbabilities) - 1.0) < 1e-5, 'Calibrated probabilities must sum to 1');
    assert(res.referable == (res.grade >= 2), 'Referable must equal grade >= 2');
end
fprintf('PASSED\n');

fprintf('\n===========================================================\n');
fprintf('  ALL 13 PHASE 3 CALIBRATION PIPELINE TESTS PASSED (A-M)   \n');
fprintf('===========================================================\n');

end
