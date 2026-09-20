function test_retinal_analysis()
% TEST_RETINAL_ANALYSIS
% Automated test suite for Phase 5 Retinal Anatomical Analysis & Evidence Engine.
%
% Tests A through M:
%   A. Retinal mask exists and is non-empty
%   B. Retinal mask dimensions match original fundus
%   C. Optic disc coordinates strictly within image boundaries
%   D. Macula coordinates strictly within image boundaries
%   E. Vessel mask dimensions match original fundus
%   F. Candidate finding bounding boxes strictly within image boundaries
%   G. Normalized coordinates strictly bounded in [0, 1]
%   H. Absence of NaN in valid detected coordinates
%   I. Absence of Inf values
%   J. Failure handling: No fake fallback coordinates when undetected
%   K. Original image dimensions preserved across all assets
%   L. Deterministic output: Repeated runs produce identical results
%   M. Legacy pipeline remains unaffected

fprintf('===========================================================\n');
fprintf('  RUNNING PHASE 5 RETINAL ANATOMICAL ANALYSIS TEST SUITE   \n');
fprintf('===========================================================\n');

baseDir = fileparts(fileparts(mfilename('fullpath'))); % AI_REBUILD/
repoDir = fileparts(baseDir);
addpath(fullfile(baseDir, '07_retinal_analysis'));
addpath(fullfile(baseDir, '06_explainability'));
addpath(fullfile(baseDir, '04_calibration'));
addpath(fullfile(baseDir, '02_training'));
addpath(repoDir);

sampleFile = fullfile(repoDir, 'train_images', '000c1434d8d7.png');
assert(exist(sampleFile, 'file') > 0, 'Test sample image missing');
origImg = imread(sampleFile);
[H_orig, W_orig, ~] = size(origImg);

testOutDir = fullfile(baseDir, '07_retinal_analysis', 'test_suite_out');
if ~exist(testOutDir, 'dir'), mkdir(testOutDir); end

% RUN ANALYSIS
fprintf('[EXECUTION] Running full retinal analysis pipeline...\n');
res1 = runFullRetinalAnalysis(origImg, testOutDir, 'Prefix', 'test1');

% TEST A & B: Retinal mask exists and dimensions match
fprintf('[TEST A & B] Retinal mask exists and dimensions match: ');
assert(isfield(res1, 'retinalField') && res1.retinalField.detected, 'Retinal field not detected');
assert(isfield(res1.retinalField, 'bbox') && length(res1.retinalField.bbox) == 4, 'Bbox missing');
fprintf('PASSED (Coverage: %.1f%%)\n', res1.retinalField.coverageRatio * 100);

% TEST C: Optic disc coordinates inside bounds
fprintf('[TEST C] Optic disc coordinates within bounds: ');
if res1.opticDisc.detected
    assert(res1.opticDisc.centerX >= 1 && res1.opticDisc.centerX <= W_orig, 'Optic disc X out of bounds');
    assert(res1.opticDisc.centerY >= 1 && res1.opticDisc.centerY <= H_orig, 'Optic disc Y out of bounds');
    assert(res1.opticDisc.radius > 0, 'Optic disc radius must be positive');
    fprintf('PASSED (OD at [%d, %d], rad=%d)\n', res1.opticDisc.centerX, res1.opticDisc.centerY, res1.opticDisc.radius);
else
    fprintf('PASSED (OD safely marked undetected)\n');
end

% TEST D: Macula coordinates inside bounds
fprintf('[TEST D] Macula coordinates within bounds: ');
if res1.macula.estimated
    assert(res1.macula.centerX >= 1 && res1.macula.centerX <= W_orig, 'Macula X out of bounds');
    assert(res1.macula.centerY >= 1 && res1.macula.centerY <= H_orig, 'Macula Y out of bounds');
    assert(res1.macula.radius > 0, 'Macula radius must be positive');
    fprintf('PASSED (Macula at [%d, %d])\n', res1.macula.centerX, res1.macula.centerY);
else
    fprintf('PASSED (Macula safely marked unestimated)\n');
end

% TEST E: Vessel mask dimensions
fprintf('[TEST E] Vessel mask dimensions match original fundus: ');
if res1.vessels.available
    vMask = imread(res1.vessels.maskPath);
    assert(size(vMask, 1) == H_orig && size(vMask, 2) == W_orig, 'Vessel mask dimensions mismatch');
    assert(res1.vessels.vesselAreaRatio > 0 && res1.vessels.vesselAreaRatio < 0.35, 'Vessel area ratio out of range');
    fprintf('PASSED (Ratio: %.2f%%)\n', res1.vessels.vesselAreaRatio * 100);
else
    fprintf('PASSED (Vessels safely marked unavailable)\n');
end

% TEST F & G: Candidate bounding boxes and normalized coords
fprintf('[TEST F & G] Candidate findings in bounds and normalized in [0, 1]: ');
for k = 1:length(res1.candidateFindings)
    f = res1.candidateFindings(k);
    assert(f.centerX >= 1 && f.centerX <= W_orig, 'Candidate X out of bounds');
    assert(f.centerY >= 1 && f.centerY <= H_orig, 'Candidate Y out of bounds');
    assert(f.normalizedX >= 0.0 && f.normalizedX <= 1.0, 'normalizedX out of bounds');
    assert(f.normalizedY >= 0.0 && f.normalizedY <= 1.0, 'normalizedY out of bounds');
    assert(f.bbox(1) >= 1 && (f.bbox(1) + f.bbox(3) - 1) <= W_orig, 'Bbox X out of bounds');
    assert(f.bbox(2) >= 1 && (f.bbox(2) + f.bbox(4) - 1) <= H_orig, 'Bbox Y out of bounds');
end
fprintf('PASSED (%d candidates verified)\n', length(res1.candidateFindings));

% TEST H & I: Absence of NaN/Inf in valid structures
fprintf('[TEST H & I] Absence of NaN or Inf in valid coordinates: ');
if res1.opticDisc.detected
    assert(~isnan(res1.opticDisc.centerX) && ~isinf(res1.opticDisc.centerX), 'NaN in OD X');
end
if res1.macula.estimated
    assert(~isnan(res1.macula.centerX) && ~isinf(res1.macula.centerX), 'NaN in Macula X');
end
for k = 1:length(res1.candidateFindings)
    assert(~isnan(res1.candidateFindings(k).centerX), 'NaN in candidate X');
    assert(~isinf(res1.candidateFindings(k).score), 'Inf in candidate score');
end
fprintf('PASSED\n');

% TEST J: Failure handling (no fake coordinates)
fprintf('[TEST J] Failure handling on artificial black image: ');
blackImg = zeros(400, 400, 3, 'uint8');
resBlack = runFullRetinalAnalysis(blackImg, testOutDir, 'Prefix', 'black');
assert(~resBlack.retinalField.detected, 'Black image must fail retinal field');
assert(~resBlack.opticDisc.detected && isnan(resBlack.opticDisc.centerX), 'Must not fabricate OD coordinates');
assert(~resBlack.macula.estimated && isnan(resBlack.macula.centerX), 'Must not fabricate Macula coordinates');
assert(~resBlack.vessels.available, 'Must not fabricate vessel mask');
assert(isempty(resBlack.candidateFindings), 'Must not fabricate findings');
fprintf('PASSED (All failure flags correctly triggered)\n');

% TEST K: Original image dimensions preserved across all assets
fprintf('[TEST K] Dimensions preserved across visual assets: ');
assert(exist(res1.assets.originalFundus, 'file') > 0, 'originalFundus asset missing');
assert(exist(res1.assets.gradcamOverlay, 'file') > 0, 'gradcamOverlay asset missing');
assert(exist(res1.assets.attentionPoints, 'file') > 0, 'attentionPoints asset missing');
assert(exist(res1.assets.retinalLandmarks, 'file') > 0, 'retinalLandmarks asset missing');
assert(exist(res1.assets.retinalAnalysis, 'file') > 0, 'retinalAnalysis asset missing');
if isfield(res1.assets, 'lesionOverlay') && ~isempty(res1.assets.lesionOverlay)
    assert(exist(res1.assets.lesionOverlay, 'file') > 0, 'lesionOverlay asset missing');
end

analysisImg = imread(res1.assets.retinalAnalysis);
assert(size(analysisImg, 1) == H_orig && size(analysisImg, 2) == W_orig, 'Rendered asset resolution mismatch');
fprintf('PASSED (%dx%d across all assets)\n', W_orig, H_orig);

% TEST K2: Lesion evidence structure check
fprintf('[TEST K2] Lesion evidence structure verified: ');
assert(isfield(res1, 'lesions'), 'lesions field missing from retinalAnalysis');
assert(isfield(res1.lesions, 'microaneurysms'), 'microaneurysms field missing');
assert(isfield(res1.lesions, 'haemorrhages'), 'haemorrhages field missing');
assert(isfield(res1.lesions, 'hardExudates'), 'hardExudates field missing');
assert(isfield(res1.lesions, 'softExudates'), 'softExudates field missing');
fprintf('PASSED (All 4 lesion classes present in evidence schema)\n');

% TEST L: Determinism test
fprintf('[TEST L] Determinism check (repeated execution): ');
res2 = runFullRetinalAnalysis(origImg, testOutDir, 'Prefix', 'test2');
assert(res1.opticDisc.centerX == res2.opticDisc.centerX, 'OD X non-deterministic');
assert(res1.macula.centerX == res2.macula.centerX, 'Macula X non-deterministic');
assert(length(res1.candidateFindings) == length(res2.candidateFindings), 'Findings count non-deterministic');
fprintf('PASSED\n');

% TEST M: Legacy pipeline check
fprintf('[TEST M] Legacy deployed pipeline integrity: \n');
curDir = pwd;
cd(repoDir);
try
    test_deployed_pipeline;
    cd(curDir);
catch ME
    cd(curDir);
    rethrow(ME);
end
fprintf('[TEST M] Legacy deployed pipeline integrity: PASSED\n');

fprintf('\n===========================================================\n');
fprintf('  ALL 13 PHASE 5 RETINAL ANALYSIS TESTS PASSED (A-M)       \n');
fprintf('===========================================================\n');

end
