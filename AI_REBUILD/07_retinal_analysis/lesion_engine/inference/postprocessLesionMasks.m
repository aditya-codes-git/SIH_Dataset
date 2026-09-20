function binMasks = postprocessLesionMasks(probMaps, retinalMask, opticDiscMask, thresholds)
% POSTPROCESSLESIONMASKS
% Converts continuous lesion probability maps into binary lesion masks
% applying clinical aperture constraints and noise filtering.
%
% Operations:
%   1. Thresholding by class-specific operating points.
%   2. Masking by retinal field boundary (excludes camera edge artifacts).
%   3. Optional suppression of exudate false positives inside the optic disc.
%   4. Morphological noise suppression (removes single-pixel artifacts).
%
% Inputs:
%   probMaps: [H, W, 4] single probabilities in [0, 1]
%   retinalMask: [H, W] logical fundus aperture mask
%   opticDiscMask: [H, W] logical optic disc mask (optional)
%   thresholds: [1x4] operating thresholds for [MA, HE, EX, SE] (default [0.4, 0.4, 0.4, 0.35])

[H, W, C] = size(probMaps);

if nargin < 2 || isempty(retinalMask)
    retinalMask = true(H, W);
end
if nargin < 3 || isempty(opticDiscMask)
    opticDiscMask = false(H, W);
end
if nargin < 4 || isempty(thresholds)
    thresholds = [0.40, 0.40, 0.40, 0.35]; % Calibrated operating points
end

binMasks = false(H, W, C);

for k = 1:C
    th = thresholds(k);
    mask = (probMaps(:, :, k) >= th);
    
    % Constrain strictly inside retinal boundary
    mask = mask & retinalMask;
    
    % Hard Exudates (k=3) suppression inside Optic Disc
    if k == 3 && any(opticDiscMask(:))
        mask = mask & ~opticDiscMask;
    end
    
    % Suppress single isolated 1-pixel noise
    kFilter = [0 1 0; 1 0 1; 0 1 0];
    neighborCount = filter2(kFilter, double(mask));
    % Keep pixel only if it has at least 1 4-connected neighbor (or if MA, keep isolated punctate)
    if k ~= 1
        mask = mask & (neighborCount >= 1);
    end
    
    binMasks(:, :, k) = mask;
end
end
