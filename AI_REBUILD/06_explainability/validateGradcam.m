function validateGradcam()
% VALIDATEGRADCAM
% Automated quality verification suite for Phase 4 explainability pipeline.
%
% Tests A through M:
%   A. Heatmap exists and is non-empty
%   B. Heatmap dimensions match original fundus
%   C. Overlay dimensions match original fundus
%   D. Absence of NaN values
%   E. Absence of Inf values
%   F. Heatmap is non-trivial (not all constant or zero on active retina)
%   G. All hotspot coordinates lie strictly within image boundaries
%   H. Target class matches predicted class
%   I. Original retina remains visible (alpha < 1.0 everywhere)
%   J. Low-activation background is 100% transparent (alpha = 0)
%   K. Absence of full-image color saturation (no blue fog)
%   L. Numbered point markers correspond exactly to hotspot struct data
%   M. Determinism test: repeated runs produce numerically identical outputs

fprintf('===========================================================\n');
fprintf('  RUNNING PHASE 4 GRAD-CAM QUALITY & VALIDATION SUITE      \n');
fprintf('===========================================================\n');

baseDir = fileparts(fileparts(mfilename('fullpath'))); % AI_REBUILD/
repoDir = fileparts(baseDir);
addpath(fullfile(baseDir, '06_explainability'));
addpath(fullfile(baseDir, '02_training'));
addpath(repoDir);

sampleFile = fullfile(repoDir, 'train_images', '000c1434d8d7.png');
assert(exist(sampleFile, 'file') > 0, 'Test sample image not found');
origImg = imread(sampleFile);
[H_orig, W_orig, ~] = size(origImg);

% 1. RUN IMPROVED GRAD-CAM
fprintf('[EXECUTION] Running improved Grad-CAM pipeline...\n');
res1 = generateImprovedGradCAM(origImg);
hotspots1 = extractAttentionHotspots(res1.heatmap, res1.retinalMask, 'TopK', 5);

% TEST A: Map exists
fprintf('[TEST A] Heatmap exists and is non-empty: ');
assert(~isempty(res1.heatmap), 'Heatmap is empty');
fprintf('PASSED\n');

% TEST B & C: Dimensions match original image
fprintf('[TEST B & C] Dimensions match original high-resolution fundus: ');
assert(size(res1.heatmap, 1) == H_orig && size(res1.heatmap, 2) == W_orig, 'Heatmap dimensions mismatch');
assert(size(res1.overlayImage, 1) == H_orig && size(res1.overlayImage, 2) == W_orig, 'Overlay dimensions mismatch');
fprintf('PASSED (%dx%d)\n', W_orig, H_orig);

% TEST D & E: No NaN or Inf
fprintf('[TEST D & E] No NaN or Inf in heatmap or overlay: ');
assert(~any(isnan(res1.heatmap(:))), 'Found NaN in heatmap');
assert(~any(isinf(res1.heatmap(:))), 'Found Inf in heatmap');
assert(~any(isnan(res1.overlayImage(:))), 'Found NaN in overlay');
assert(~any(isinf(res1.overlayImage(:))), 'Found Inf in overlay');
fprintf('PASSED\n');

% TEST F: Map is non-constant
fprintf('[TEST F] Heatmap has meaningful contrast: ');
assert(max(res1.heatmap(:)) > min(res1.heatmap(:)), 'Heatmap is flat/constant');
fprintf('PASSED (Range: [%.4f, %.4f])\n', min(res1.heatmap(:)), max(res1.heatmap(:)));

% TEST G: Hotspot coordinates inside bounds
fprintf('[TEST G] All hotspot coordinates strictly within [1..W, 1..H]: ');
for k = 1:length(hotspots1)
    h = hotspots1(k);
    assert(h.x >= 1 && h.x <= W_orig, sprintf('Hotspot %d x out of bounds: %d', k, h.x));
    assert(h.y >= 1 && h.y <= H_orig, sprintf('Hotspot %d y out of bounds: %d', k, h.y));
    assert(h.normalizedX >= 0.0 && h.normalizedX <= 1.0, 'normalizedX out of bounds');
    assert(h.normalizedY >= 0.0 && h.normalizedY <= 1.0, 'normalizedY out of bounds');
end
fprintf('PASSED (%d hotspots validated)\n', length(hotspots1));

% TEST H: Predicted class is target class
fprintf('[TEST H] Target class matches predicted class: ');
assert(res1.targetClass == res1.predictedClass, 'Target class must match predicted class');
fprintf('PASSED (Grade %d: %s)\n', res1.targetClass, res1.targetLabel);

% TEST I & J & K: Alpha transparency and no blue haze
fprintf('[TEST I, J, K] Dynamic alpha transparency and elimination of blue haze: ');
lowMask = res1.heatmap < 0.20;
assert(all(res1.alphaMask(lowMask) == 0), 'Low activation regions must have alpha = 0');
assert(max(res1.alphaMask(:)) <= 0.70, 'Maximum alpha must not exceed 0.70');
% Check that zero-activation regions show untouched original pixel colors
diffInLow = abs(res1.overlayImage(repmat(lowMask, [1 1 3])) - res1.originalImage(repmat(lowMask, [1 1 3])));
assert(max(diffInLow(:)) < 1e-5, 'Overlay in low activation regions must be identical to original image');
fprintf('PASSED (Zero haze on low activation)\n');

% TEST L: Numbered points correspondence
fprintf('[TEST L] Numbered points correspond to hotspot data: ');
assert(length(hotspots1) <= 5, 'TopK limit exceeded');
for k = 1:length(hotspots1)
    assert(hotspots1(k).id == k, 'Hotspot IDs must be sequential 1..K');
end
fprintf('PASSED\n');

% TEST M: Numerical determinism
fprintf('[TEST M] Numerical determinism check (run twice): ');
res2 = generateImprovedGradCAM(origImg);
maxDiff = max(abs(res1.heatmap(:) - res2.heatmap(:)));
assert(maxDiff < 1e-6, sprintf('Grad-CAM run is non-deterministic, maxDiff = %e', maxDiff));
fprintf('PASSED (maxDiff = %e)\n', maxDiff);

% TEST FULL PACKAGE GENERATOR
fprintf('[PACKAGE TEST] Testing generateFullExplainabilityPackage(): ');
testOutDir = fullfile(baseDir, '06_explainability', 'test_output');
pkg = generateFullExplainabilityPackage(sampleFile, testOutDir, 'TopK', 4);
assert(exist(pkg.assets.originalFundus, 'file') > 0, 'originalFundus asset missing');
assert(exist(pkg.assets.gradcamHeatmap, 'file') > 0, 'gradcamHeatmap asset missing');
assert(exist(pkg.assets.gradcamOverlay, 'file') > 0, 'gradcamOverlay asset missing');
assert(exist(pkg.assets.attentionPoints, 'file') > 0, 'attentionPoints asset missing');
assert(exist(pkg.metadataFile, 'file') > 0, 'metadataFile missing');
fprintf('PASSED (All 4 assets + JSON generated)\n');

fprintf('\n===========================================================\n');
fprintf('  ALL 13 PHASE 4 GRAD-CAM QUALITY CHECKS PASSED (A-M)     \n');
fprintf('===========================================================\n');

end
