function [summaryStats, detailedTable] = evaluateOfficialTest(varargin)
% EVALUATEOFFICIALTEST
% Evaluates the frozen lesion segmentation model ONCE on the official 27-image IDRiD test set.
%
% Generates:
%   - Per-class and per-image Dice, IoU, Sensitivity, Precision, Specificity
%   - Mean and median aggregate statistics
%   - Structured lesion evidence JSON/MAT
%   - Visualizations for gallery

p = inputParser;
addParameter(p, 'ModelPath', 'AI_REBUILD/07_retinal_analysis/lesion_engine/segmentation_training/models/best_lesion_unet.mat', @ischar);
addParameter(p, 'IndexCsv', 'AI_REBUILD/07_retinal_analysis/lesion_engine/idrid_segmentation_index.csv', @ischar);
addParameter(p, 'OutputDir', 'AI_REBUILD/07_retinal_analysis/lesion_engine/segmentation_evaluation/results', @ischar);
addParameter(p, 'GalleryDir', 'AI_REBUILD/07_retinal_analysis/lesion_engine/visualization/lesion_gallery', @ischar);
addParameter(p, 'UseGpu', true, @islogical);
parse(p, varargin{:});

modelPath = p.Results.ModelPath;
indexCsv = p.Results.IndexCsv;
outputDir = p.Results.OutputDir;
galleryDir = p.Results.GalleryDir;
useGpu = p.Results.UseGpu;

if ~exist(outputDir, 'dir'), mkdir(outputDir); end
if ~exist(galleryDir, 'dir'), mkdir(galleryDir); end

% 1. Load Model
fprintf('=== PHASE 6C: OFFICIAL IDRiD TEST EVALUATION (FINAL HOLDOUT) ===\n');
fprintf('Loading frozen lesion model: %s\n', modelPath);
modelData = load(modelPath);
net = modelData.net;

if isfield(modelData, 'config') && isfield(modelData.config, 'thresholds')
    thresholds = modelData.config.thresholds;
else
    thresholds = [0.40, 0.40, 0.40, 0.35]; % Standard calibrated thresholds
end

fprintf('Loaded network with %d layers. Thresholds: [%.2f, %.2f, %.2f, %.2f]\n', ...
    numel(net.Layers), thresholds(1), thresholds(2), thresholds(3), thresholds(4));

% 2. Read Canonical Index
opts = detectImportOptions(indexCsv);
opts.VariableTypes(:) = {'char'};
rawTbl = readtable(indexCsv, opts);

isTest = strcmp(rawTbl.official_split, 'TEST');
testTbl = rawTbl(isTest, :);
N_test = height(testTbl);
fprintf('Identified %d official test images (IDRiD_55 to IDRiD_81).\n\n', N_test);

classCodes = {'MA', 'HE', 'EX', 'SE'};
classNames = {'Microaneurysms', 'Haemorrhages', 'Hard Exudates', 'Soft Exudates'};

% Result storage matrices [N_test x 4]
diceMatrix = zeros(N_test, 4);
iouMatrix = zeros(N_test, 4);
sensMatrix = zeros(N_test, 4);
precMatrix = zeros(N_test, 4);
specMatrix = zeros(N_test, 4);
gtPxMatrix = zeros(N_test, 4);
predPxMatrix = zeros(N_test, 4);
isGtEmptyMatrix = false(N_test, 4);
isPredEmptyMatrix = false(N_test, 4);

imageIds = testTbl.image_id;
allEvidence = cell(N_test, 1);

predOpts = struct('patchSize', [256, 256], 'stride', 128, 'useGPU', useGpu);

startTime = tic;

for i = 1:N_test
    imgId = testTbl.image_id{i};
    imgPath = testTbl.image_path{i};
    fprintf('[%2d/%2d] Evaluating %s...', i, N_test, imgId);
    
    img = imread(imgPath);
    [H, W, ~] = size(img);
    
    % Retinal aperture mask
    grayVal = max(img, [], 3);
    retinalMask = (grayVal > 15);
    
    % Load Ground Truth Masks
    gtMasks = false(H, W, 4);
    
    % MA
    if ~isempty(testTbl.ma_mask_path{i}) && ~strcmp(testTbl.ma_mask_path{i}, 'NA') && exist(testTbl.ma_mask_path{i}, 'file')
        rawM = imread(testTbl.ma_mask_path{i});
        if size(rawM, 3) > 1, rawM = rawM(:, :, 1); end
        gtMasks(:, :, 1) = (rawM > 0);
    end
    % HE
    if ~isempty(testTbl.he_mask_path{i}) && ~strcmp(testTbl.he_mask_path{i}, 'NA') && exist(testTbl.he_mask_path{i}, 'file')
        rawM = imread(testTbl.he_mask_path{i});
        if size(rawM, 3) > 1, rawM = rawM(:, :, 1); end
        gtMasks(:, :, 2) = (rawM > 0);
    end
    % EX
    if ~isempty(testTbl.ex_mask_path{i}) && ~strcmp(testTbl.ex_mask_path{i}, 'NA') && exist(testTbl.ex_mask_path{i}, 'file')
        rawM = imread(testTbl.ex_mask_path{i});
        if size(rawM, 3) > 1, rawM = rawM(:, :, 1); end
        gtMasks(:, :, 3) = (rawM > 0);
    end
    % SE
    if ~isempty(testTbl.se_mask_path{i}) && ~strcmp(testTbl.se_mask_path{i}, 'NA') && exist(testTbl.se_mask_path{i}, 'file')
        rawM = imread(testTbl.se_mask_path{i});
        if size(rawM, 3) > 1, rawM = rawM(:, :, 1); end
        gtMasks(:, :, 4) = (rawM > 0);
    end
    % OD (Optic Disc)
    odMask = false(H, W);
    if ~isempty(testTbl.optic_disc_mask_path{i}) && ~strcmp(testTbl.optic_disc_mask_path{i}, 'NA') && exist(testTbl.optic_disc_mask_path{i}, 'file')
        rawM = imread(testTbl.optic_disc_mask_path{i});
        if size(rawM, 3) > 1, rawM = rawM(:, :, 1); end
        odMask = (rawM > 0);
    end
    
    % 3. Run Tiled Model Inference
    probMaps = predictLesions(img, net, predOpts);
    
    % 4. Postprocess Masks
    binMasks = postprocessLesionMasks(probMaps, retinalMask, odMask, thresholds);
    
    % 5. Extract Structured Lesion Evidence
    evidence = extractLesionEvidence(binMasks, probMaps, retinalMask, '', imgId);
    allEvidence{i} = evidence;
    
    % 6. Compute Metrics for each class
    for c = 1:4
        m = calculateLesionMetrics(binMasks(:, :, c), gtMasks(:, :, c), retinalMask);
        diceMatrix(i, c) = m.dice;
        iouMatrix(i, c) = m.iou;
        sensMatrix(i, c) = m.sensitivity;
        precMatrix(i, c) = m.precision;
        specMatrix(i, c) = m.specificity;
        gtPxMatrix(i, c) = m.gtPixels;
        predPxMatrix(i, c) = m.predPixels;
        isGtEmptyMatrix(i, c) = m.isGtEmpty;
        isPredEmptyMatrix(i, c) = m.isPredEmpty;
    end
    
    fprintf(' Dice: MA=%.3f, HE=%.3f, EX=%.3f, SE=%.3f\n', ...
        diceMatrix(i, 1), diceMatrix(i, 2), diceMatrix(i, 3), diceMatrix(i, 4));
    
    % 7. Generate Visualizations for Gallery (Diverse representative cases)
    if ismember(imgId, {'IDRiD_55', 'IDRiD_56', 'IDRiD_57', 'IDRiD_60', 'IDRiD_65', 'IDRiD_70', 'IDRiD_72', 'IDRiD_75', 'IDRiD_80', 'IDRiD_81'})
        renderLesionOverlay(img, binMasks, gtMasks, galleryDir, imgId);
    end
end

evalElapsed = toc(startTime);
fprintf('\nOfficial Test Evaluation completed in %.1f seconds.\n\n', evalElapsed);

% 8. Build Detailed Table
varNames = {'image_id'};
tblData = cell(N_test, 1 + 4*7);

for i = 1:N_test
    tblData{i, 1} = imageIds{i};
end

for c = 1:4
    code = classCodes{c};
    varNames = [varNames, ...
        {[code '_Dice']}, {[code '_IoU']}, {[code '_Sensitivity']}, ...
        {[code '_Precision']}, {[code '_Specificity']}, ...
        {[code '_GtPixels']}, {[code '_PredPixels']}]; %#ok<AGROW>
    
    for i = 1:N_test
        colOffset = 1 + (c-1)*7;
        tblData{i, colOffset + 1} = diceMatrix(i, c);
        tblData{i, colOffset + 2} = iouMatrix(i, c);
        tblData{i, colOffset + 3} = sensMatrix(i, c);
        tblData{i, colOffset + 4} = precMatrix(i, c);
        tblData{i, colOffset + 5} = specMatrix(i, c);
        tblData{i, colOffset + 6} = gtPxMatrix(i, c);
        tblData{i, colOffset + 7} = predPxMatrix(i, c);
    end
end

detailedTable = cell2table(tblData, 'VariableNames', varNames);
detailedCsvPath = fullfile(outputDir, 'official_test_detailed_results.csv');
writetable(detailedTable, detailedCsvPath);
fprintf('Saved detailed test results to %s\n', detailedCsvPath);

% 9. Compute Aggregate Statistics per Class
summaryStats = struct();

fprintf('=========================================================================\n');
fprintf('             OFFICIAL TEST SET RESULTS (27 HELD-OUT IMAGES)             \n');
fprintf('=========================================================================\n');
fprintf('%-6s | %-12s | %-8s | %-8s | %-8s | %-8s | %-8s\n', ...
    'Class', 'Annotated', 'Dice', 'IoU', 'Sens', 'Prec', 'Spec');
fprintf('-------------------------------------------------------------------------\n');

for c = 1:4
    code = classCodes{c};
    name = classNames{c};
    
    % Annotated images count (images with GT > 0)
    hasGt = ~isGtEmptyMatrix(:, c);
    nAnnotated = sum(hasGt);
    
    % Metrics over images with ground truth
    dices = diceMatrix(hasGt, c);
    ious = iouMatrix(hasGt, c);
    sens = sensMatrix(hasGt, c);
    precs = precMatrix(hasGt, c);
    specs = specMatrix(:, c);
    
    meanDice = mean(dices);
    medianDice = median(dices);
    meanIoU = mean(ious);
    
    % For sensitivity & precision, ignore NaN cases where no prediction was made
    validSens = sens(~isnan(sens));
    validPrec = precs(~isnan(precs));
    
    meanSens = mean(validSens);
    meanPrec = mean(validPrec);
    meanSpec = mean(specs);
    
    fprintf('%-6s | %2d/%2d (%4.1f%%) | %8.4f | %8.4f | %8.4f | %8.4f | %8.4f\n', ...
        code, nAnnotated, N_test, 100*nAnnotated/N_test, ...
        meanDice, meanIoU, meanSens, meanPrec, meanSpec);
    
    summaryStats.(code) = struct(...
        'name', name, ...
        'totalImages', N_test, ...
        'annotatedImages', nAnnotated, ...
        'meanDice', meanDice, ...
        'medianDice', medianDice, ...
        'meanIoU', meanIoU, ...
        'meanSensitivity', meanSens, ...
        'meanPrecision', meanPrec, ...
        'meanSpecificity', meanSpec, ...
        'totalGtPixels', sum(gtPxMatrix(:, c)), ...
        'totalPredPixels', sum(predPxMatrix(:, c)) ...
    );
end
fprintf('=========================================================================\n\n');

% Save MAT file with full results
resultsMatPath = fullfile(outputDir, 'official_test_results.mat');
save(resultsMatPath, 'summaryStats', 'detailedTable', 'diceMatrix', 'iouMatrix', ...
    'sensMatrix', 'precMatrix', 'specMatrix', 'gtPxMatrix', 'predPxMatrix', ...
    'allEvidence', 'imageIds');
fprintf('Saved MAT results to %s\n', resultsMatPath);

end
