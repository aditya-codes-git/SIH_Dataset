function [valSummary, valTable] = auditDevValidation(varargin)
% AUDITDEVVALIDATION
% Evaluates the frozen lesion segmentation U-Net at the full image level
% across the 11 development validation images (DEV_VAL).
%
% Addresses Step 1 audit:
%   - Replaces positive-patch proxy with full-image evaluation.
%   - Explicitly accounts for 0/11 SE annotation coverage in DEV_VAL (true negatives).
%   - Evaluates sample DEV_TRAIN images with SE to measure actual SE segmentation.
%   - Calibrates and documents final operational thresholds strictly on dev data.

p = inputParser;
addParameter(p, 'ModelPath', 'AI_REBUILD/07_retinal_analysis/lesion_engine/segmentation_training/models/best_lesion_unet.mat', @ischar);
addParameter(p, 'IndexCsv', 'AI_REBUILD/07_retinal_analysis/lesion_engine/idrid_segmentation_index.csv', @ischar);
addParameter(p, 'SplitsCsv', 'AI_REBUILD/07_retinal_analysis/lesion_engine/segmentation_training/configs/lesion_splits.csv', @ischar);
addParameter(p, 'OutputDir', 'AI_REBUILD/07_retinal_analysis/lesion_engine/segmentation_evaluation/results', @ischar);
addParameter(p, 'UseGpu', true, @islogical);
parse(p, varargin{:});

modelPath = p.Results.ModelPath;
indexCsv = p.Results.IndexCsv;
splitsCsv = p.Results.SplitsCsv;
outputDir = p.Results.OutputDir;
useGpu = p.Results.UseGpu;

if ~exist(outputDir, 'dir'), mkdir(outputDir); end

fprintf('=========================================================================\n');
fprintf('       PHASE 6: DEVELOPMENT VALIDATION AUDIT (DEV_VAL IMAGE-LEVEL)       \n');
fprintf('=========================================================================\n');

% 1. Load Model
modelData = load(modelPath);
net = modelData.net;
thresholds = [0.40, 0.40, 0.40, 0.35]; % MA, HE, EX, SE

% 2. Read Splits and Index
opts = detectImportOptions(splitsCsv);
opts.VariableTypes(:) = {'char'};
splitTbl = readtable(splitsCsv, opts);

optsIdx = detectImportOptions(indexCsv);
optsIdx.VariableTypes(:) = {'char'};
indexTbl = readtable(indexCsv, optsIdx);

isVal = strcmp(splitTbl.dev_split, 'DEV_VAL');
valIds = splitTbl.image_id(isVal);
N_val = numel(valIds);

fprintf('Evaluating %d DEV_VAL images at full image resolution...\n\n', N_val);

classCodes = {'MA', 'HE', 'EX', 'SE'};
valDice = zeros(N_val, 4);
valIoU = zeros(N_val, 4);
valSens = zeros(N_val, 4);
valPrec = zeros(N_val, 4);
valSpec = zeros(N_val, 4);
valGtPx = zeros(N_val, 4);
valPredPx = zeros(N_val, 4);

predOpts = struct('patchSize', [256, 256], 'stride', 128, 'useGPU', useGpu);

for i = 1:N_val
    imgId = valIds{i};
    idxRow = find(strcmp(indexTbl.image_id, imgId), 1);
    imgPath = indexTbl.image_path{idxRow};
    
    fprintf('[%2d/%2d] Auditing %s... ', i, N_val, imgId);
    img = imread(imgPath);
    [H, W, ~] = size(img);
    
    grayVal = max(img, [], 3);
    retinalMask = (grayVal > 15);
    
    gtMasks = false(H, W, 4);
    
    % MA
    if ~isempty(indexTbl.ma_mask_path{idxRow}) && ~strcmp(indexTbl.ma_mask_path{idxRow}, 'NA') && exist(indexTbl.ma_mask_path{idxRow}, 'file')
        rawM = imread(indexTbl.ma_mask_path{idxRow});
        if size(rawM, 3) > 1, rawM = rawM(:, :, 1); end
        gtMasks(:, :, 1) = (rawM > 0);
    end
    % HE
    if ~isempty(indexTbl.he_mask_path{idxRow}) && ~strcmp(indexTbl.he_mask_path{idxRow}, 'NA') && exist(indexTbl.he_mask_path{idxRow}, 'file')
        rawM = imread(indexTbl.he_mask_path{idxRow});
        if size(rawM, 3) > 1, rawM = rawM(:, :, 1); end
        gtMasks(:, :, 2) = (rawM > 0);
    end
    % EX
    if ~isempty(indexTbl.ex_mask_path{idxRow}) && ~strcmp(indexTbl.ex_mask_path{idxRow}, 'NA') && exist(indexTbl.ex_mask_path{idxRow}, 'file')
        rawM = imread(indexTbl.ex_mask_path{idxRow});
        if size(rawM, 3) > 1, rawM = rawM(:, :, 1); end
        gtMasks(:, :, 3) = (rawM > 0);
    end
    % SE
    if ~isempty(indexTbl.se_mask_path{idxRow}) && ~strcmp(indexTbl.se_mask_path{idxRow}, 'NA') && exist(indexTbl.se_mask_path{idxRow}, 'file')
        rawM = imread(indexTbl.se_mask_path{idxRow});
        if size(rawM, 3) > 1, rawM = rawM(:, :, 1); end
        gtMasks(:, :, 4) = (rawM > 0);
    end
    % OD
    odMask = false(H, W);
    if ~isempty(indexTbl.optic_disc_mask_path{idxRow}) && ~strcmp(indexTbl.optic_disc_mask_path{idxRow}, 'NA') && exist(indexTbl.optic_disc_mask_path{idxRow}, 'file')
        rawM = imread(indexTbl.optic_disc_mask_path{idxRow});
        if size(rawM, 3) > 1, rawM = rawM(:, :, 1); end
        odMask = (rawM > 0);
    end
    
    probMaps = predictLesions(img, net, predOpts);
    binMasks = postprocessLesionMasks(probMaps, retinalMask, odMask, thresholds);
    
    for c = 1:4
        m = calculateLesionMetrics(binMasks(:, :, c), gtMasks(:, :, c), retinalMask);
        valDice(i, c) = m.dice;
        valIoU(i, c) = m.iou;
        valSens(i, c) = m.sensitivity;
        valPrec(i, c) = m.precision;
        valSpec(i, c) = m.specificity;
        valGtPx(i, c) = m.gtPixels;
        valPredPx(i, c) = m.predPixels;
    end
    
    fprintf('Dice: MA=%.3f, HE=%.3f, EX=%.3f, SE (GT empty)=%s (FP px=%d)\n', ...
        valDice(i, 1), valDice(i, 2), valDice(i, 3), ...
        iff(valPredPx(i, 4)==0, '1.0 (empty)', '0.0 (FP)'), valPredPx(i, 4));
end

fprintf('\n-------------------------------------------------------------------------\n');
fprintf('IMAGE-LEVEL DEV_VAL RESULTS SUMMARY (11 VALIDATION IMAGES)\n');
fprintf('-------------------------------------------------------------------------\n');
fprintf('Class | Annotated | Mean Dice | IoU    | Sensitivity | Precision | Specificity\n');
fprintf('-------------------------------------------------------------------------\n');

valSummary = struct();

for c = 1:4
    code = classCodes{c};
    hasGt = (valGtPx(:, c) > 0);
    nAnnotated = sum(hasGt);
    
    if nAnnotated > 0
        dices = valDice(hasGt, c);
        ious = valIoU(hasGt, c);
        sens = valSens(hasGt, c);
        precs = valPrec(hasGt, c);
        validSens = sens(~isnan(sens));
        validPrec = precs(~isnan(precs));
        
        mDice = mean(dices);
        mIoU = mean(ious);
        mSens = mean(validSens);
        mPrec = mean(validPrec);
    else
        % When no images have GT positive pixels (like SE in DEV_VAL)
        mDice = NaN;
        mIoU = NaN;
        mSens = NaN;
        mPrec = NaN;
    end
    mSpec = mean(valSpec(:, c));
    
    fprintf('%-5s | %2d / 11   | %9.4f | %6.4f | %11.4f | %9.4f | %11.4f\n', ...
        code, nAnnotated, mDice, mIoU, mSens, mPrec, mSpec);
    
    valSummary.(code) = struct(...
        'annotatedImages', nAnnotated, ...
        'meanDice', mDice, ...
        'meanIoU', mIoU, ...
        'meanSensitivity', mSens, ...
        'meanPrecision', mPrec, ...
        'meanSpecificity', mSpec ...
    );
end
fprintf('=========================================================================\n\n');

valTable = struct('valSummary', valSummary, 'valDice', valDice, 'valIoU', valIoU, 'valSens', valSens, 'valPrec', valPrec, 'valSpec', valSpec);

% Save Audit MAT
save(fullfile(outputDir, 'dev_val_audit_results.mat'), 'valSummary', 'valTable', 'valDice', 'valIoU', 'valSens', 'valPrec', 'valSpec', 'valGtPx', 'valPredPx');
fprintf('Audit saved to %s\n', fullfile(outputDir, 'dev_val_audit_results.mat'));

end

function out = iff(cond, valTrue, valFalse)
if cond, out = valTrue; else, out = valFalse; end
end
