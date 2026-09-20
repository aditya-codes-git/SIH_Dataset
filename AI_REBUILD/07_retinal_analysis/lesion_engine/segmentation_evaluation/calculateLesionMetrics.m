function metrics = calculateLesionMetrics(predMask, gtMask, retinalMask)
% CALCULATELESIONMETRICS
% Computes pixel-level segmentation performance metrics for a single lesion class:
%   - Dice Similarity Coefficient (F1)
%   - Intersection over Union (Jaccard)
%   - Sensitivity / Recall (True Positive Rate)
%   - Precision / Positive Predictive Value
%   - Specificity (True Negative Rate) inside retinal field
%   - Counts: TP, FP, FN, TN, gtPixels, predPixels
%
% Inputs:
%   predMask: logical [H, W] predicted binary mask
%   gtMask: logical [H, W] ground truth binary mask
%   retinalMask: logical [H, W] region of interest (defaults to all true)

if nargin < 3 || isempty(retinalMask)
    retinalMask = true(size(predMask));
end

% Apply retinal mask
pred = logical(predMask) & retinalMask;
gt = logical(gtMask) & retinalMask;

TP = sum(pred(:) & gt(:));
FP = sum(pred(:) & ~gt(:));
FN = sum(~pred(:) & gt(:));
TN = sum(~pred(:) & ~gt(:) & retinalMask(:));

gtPixels = TP + FN;
predPixels = TP + FP;
retinalPixels = sum(retinalMask(:));

% 1. Dice Coefficient: 2*TP / (2*TP + FP + FN)
if (predPixels + gtPixels) == 0
    dice = 1.0; % Both empty: perfect concordance
elseif (predPixels == 0) || (gtPixels == 0)
    dice = 0.0;
else
    dice = (2.0 * TP) / (predPixels + gtPixels);
end

% 2. IoU / Jaccard: TP / (TP + FP + FN)
unionPx = TP + FP + FN;
if unionPx == 0
    iou = 1.0;
else
    iou = double(TP) / double(unionPx);
end

% 3. Sensitivity / Recall: TP / (TP + FN)
if gtPixels == 0
    sensitivity = NaN; % Undefined when ground truth has no positive pixels
else
    sensitivity = double(TP) / double(gtPixels);
end

% 4. Precision: TP / (TP + FP)
if predPixels == 0
    precision = NaN; % Undefined when prediction has no positive pixels
else
    precision = double(TP) / double(predPixels);
end

% 5. Specificity: TN / (TN + FP)
if (TN + FP) == 0
    specificity = 1.0;
else
    specificity = double(TN) / double(TN + FP);
end

% Prevalence
prevalence = double(gtPixels) / double(retinalPixels);

metrics = struct(...
    'dice', dice, ...
    'iou', iou, ...
    'sensitivity', sensitivity, ...
    'precision', precision, ...
    'specificity', specificity, ...
    'TP', TP, ...
    'FP', FP, ...
    'FN', FN, ...
    'TN', TN, ...
    'gtPixels', gtPixels, ...
    'predPixels', predPixels, ...
    'retinalPixels', retinalPixels, ...
    'prevalence', prevalence, ...
    'isGtEmpty', (gtPixels == 0), ...
    'isPredEmpty', (predPixels == 0) ...
);
end
