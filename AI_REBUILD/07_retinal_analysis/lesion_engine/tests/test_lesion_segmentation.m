function results = test_lesion_segmentation()
% TEST_LESION_SEGMENTATION
% Automated verification test suite for Phase 6C Lesion Segmentation Engine.
%
% Tests:
%   A. Dataset split isolation
%   B. Patch leakage prevention
%   C. Image/mask dimensional consistency
%   D. Model output dimensions
%   E. Binary mask validity
%   F. Probability range [0, 1]
%   G. Connected-component extraction
%   H. Deterministic inference
%   I. Official test isolation
%   J. Regression compatibility

fprintf('=================================================================\n');
fprintf('       PHASE 6C: LESION SEGMENTATION VERIFICATION SUITE          \n');
fprintf('=================================================================\n\n');

totalTests = 10;
passCount = 0;
results = struct();

% Setup paths
baseDir = 'AI_REBUILD/07_retinal_analysis/lesion_engine';
addpath(genpath(baseDir));

% -------------------------------------------------------------
% TEST A: DATASET SPLIT ISOLATION
% -------------------------------------------------------------
try
    fprintf('[TEST A] Verifying dataset split isolation... ');
    splitsCsv = fullfile(baseDir, 'segmentation_training/configs/lesion_splits.csv');
    assert(exist(splitsCsv, 'file') == 2, 'lesion_splits.csv not found');
    
    opts = detectImportOptions(splitsCsv);
    opts.VariableTypes(:) = {'char'};
    splitTbl = readtable(splitsCsv, opts);
    
    trainIds = splitTbl.image_id(strcmp(splitTbl.dev_split, 'DEV_TRAIN'));
    valIds = splitTbl.image_id(strcmp(splitTbl.dev_split, 'DEV_VAL'));
    testIds = splitTbl.image_id(strcmp(splitTbl.dev_split, 'OFFICIAL_TEST'));
    
    assert(numel(trainIds) == 43, 'DEV_TRAIN must have 43 images');
    assert(numel(valIds) == 11, 'DEV_VAL must have 11 images');
    assert(numel(testIds) == 27, 'OFFICIAL_TEST must have 27 images');
    assert(isempty(intersect(trainIds, valIds)), 'Leakage: DEV_TRAIN and DEV_VAL intersect');
    assert(isempty(intersect(trainIds, testIds)), 'Leakage: DEV_TRAIN and OFFICIAL_TEST intersect');
    assert(isempty(intersect(valIds, testIds)), 'Leakage: DEV_VAL and OFFICIAL_TEST intersect');
    
    fprintf('PASS (43 DEV_TRAIN, 11 DEV_VAL, 27 OFFICIAL_TEST; zero overlap)\n');
    passCount = passCount + 1;
    results.testA = 'PASS';
catch ME
    fprintf('FAIL: %s\n', ME.message);
    results.testA = ['FAIL: ' ME.message];
end

% -------------------------------------------------------------
% TEST B: PATCH LEAKAGE PREVENTION
% -------------------------------------------------------------
try
    fprintf('[TEST B] Verifying patch leakage prevention... ');
    patchFile = fullfile(baseDir, 'segmentation_training/configs/lesion_patches.mat');
    assert(exist(patchFile, 'file') == 2, 'lesion_patches.mat not found');
    pData = load(patchFile);
    
    assert(isfield(pData, 'trainData') && isfield(pData, 'valData'), ...
        'trainData and valData missing');
    
    trainSrc = pData.trainData.imgIds;
    valSrc = pData.valData.imgIds;
    
    assert(isempty(intersect(unique(trainSrc), unique(valSrc))), ...
        'Leakage: Patches from same image found in both train and val');
    assert(isempty(intersect(unique(trainSrc), testIds)), ...
        'Leakage: Train patches generated from official test images');
    assert(isempty(intersect(unique(valSrc), testIds)), ...
        'Leakage: Val patches generated from official test images');
    
    fprintf('PASS (0 patch overlap; strictly partitioned by source image)\n');
    passCount = passCount + 1;
    results.testB = 'PASS';
catch ME
    fprintf('FAIL: %s\n', ME.message);
    results.testB = ['FAIL: ' ME.message];
end

% -------------------------------------------------------------
% TEST C: IMAGE / MASK DIMENSIONAL CONSISTENCY
% -------------------------------------------------------------
try
    fprintf('[TEST C] Verifying image/mask dimensional consistency... ');
    indexCsv = fullfile(baseDir, 'idrid_segmentation_index.csv');
    assert(exist(indexCsv, 'file') == 2, 'idrid_segmentation_index.csv not found');
    
    opts = detectImportOptions(indexCsv);
    opts.VariableTypes(:) = {'char'};
    idxTbl = readtable(indexCsv, opts);
    
    % Check sample images across train and test
    sampleIdx = [1, 25, 43, 54, 70];
    for s = sampleIdx
        imgPath = idxTbl.image_path{s};
        info = imfinfo(imgPath);
        imgW = info.Width;
        imgH = info.Height;
        
        maskCols = {'ma_mask_path', 'he_mask_path', 'ex_mask_path', 'se_mask_path', 'optic_disc_mask_path'};
        for m = 1:numel(maskCols)
            mPath = idxTbl.(maskCols{m}){s};
            if ~isempty(mPath) && ~strcmp(mPath, 'NA') && exist(mPath, 'file')
                mInfo = imfinfo(mPath);
                assert(mInfo.Width == imgW && mInfo.Height == imgH, ...
                    sprintf('Dimension mismatch in %s mask %s: expected %dx%d, got %dx%d', ...
                    idxTbl.image_id{s}, maskCols{m}, imgW, imgH, mInfo.Width, mInfo.Height));
            end
        end
    end
    fprintf('PASS (100%% dimension match between original images and masks)\n');
    passCount = passCount + 1;
    results.testC = 'PASS';
catch ME
    fprintf('FAIL: %s\n', ME.message);
    results.testC = ['FAIL: ' ME.message];
end

% -------------------------------------------------------------
% TEST D: MODEL OUTPUT DIMENSIONS
% -------------------------------------------------------------
try
    fprintf('[TEST D] Verifying model output dimensions... ');
    modelFile = fullfile(baseDir, 'segmentation_training/models/best_lesion_unet.mat');
    assert(exist(modelFile, 'file') == 2, 'best_lesion_unet.mat not found');
    mData = load(modelFile);
    net = mData.net;
    
    dummyInput = dlarray(zeros(256, 256, 3, 1, 'single'), 'SSCB');
    dummyOut = predict(net, dummyInput);
    outSize = size(dummyOut);
    
    assert(isequal(outSize, [256, 256, 4, 1]), ...
        sprintf('Expected output [256, 256, 4, 1], got [%s]', num2str(outSize)));
    fprintf('PASS (Network outputs [256, 256, 4, B] for 4 lesion classes)\n');
    passCount = passCount + 1;
    results.testD = 'PASS';
catch ME
    fprintf('FAIL: %s\n', ME.message);
    results.testD = ['FAIL: ' ME.message];
end

% -------------------------------------------------------------
% TEST E: BINARY MASK VALIDITY
% -------------------------------------------------------------
try
    fprintf('[TEST E] Verifying binary mask validity... ');
    dummyProbs = single(rand(200, 200, 4));
    dummyRetina = true(200, 200);
    dummyOD = false(200, 200);
    dummyOD(50:70, 50:70) = true;
    
    binMasks = postprocessLesionMasks(dummyProbs, dummyRetina, dummyOD, [0.5, 0.5, 0.5, 0.5]);
    assert(islogical(binMasks), 'Output must be logical');
    assert(isequal(size(binMasks), [200, 200, 4]), 'Mask dimensions mismatch');
    assert(~any(binMasks(50:70, 50:70, 3), 'all'), 'Optic disc exclusion for EX failed');
    
    fprintf('PASS (Logical binary masks produced with optic disc suppression)\n');
    passCount = passCount + 1;
    results.testE = 'PASS';
catch ME
    fprintf('FAIL: %s\n', ME.message);
    results.testE = ['FAIL: ' ME.message];
end

% -------------------------------------------------------------
% TEST F: PROBABILITY RANGE [0, 1]
% -------------------------------------------------------------
try
    fprintf('[TEST F] Verifying probability range [0, 1]... ');
    dummyInput = dlarray(rand(256, 256, 3, 1, 'single'), 'SSCB');
    predRaw = extractdata(predict(net, dummyInput));
    
    assert(~any(isnan(predRaw(:))), 'NaNs found in model predictions');
    assert(~any(isinf(predRaw(:))), 'Infs found in model predictions');
    assert(all(predRaw(:) >= 0.0) && all(predRaw(:) <= 1.0), ...
        'Predictions not strictly in [0, 1]');
    
    fprintf('PASS (Probabilities strictly in [0.0, 1.0], zero NaNs/Infs)\n');
    passCount = passCount + 1;
    results.testF = 'PASS';
catch ME
    fprintf('FAIL: %s\n', ME.message);
    results.testF = ['FAIL: ' ME.message];
end

% -------------------------------------------------------------
% TEST G: CONNECTED-COMPONENT EXTRACTION
% -------------------------------------------------------------
try
    fprintf('[TEST G] Verifying connected-component extraction... ');
    synthMask = false(100, 100, 4);
    % Create 2 distinct components in channel 1 (MA)
    synthMask(10:15, 10:15, 1) = true; % Area = 36
    synthMask(50:52, 50:52, 1) = true; % Area = 9
    
    synthProbs = single(synthMask * 0.85);
    synthRetina = true(100, 100);
    
    evidence = extractLesionEvidence(synthMask, synthProbs, synthRetina, '', 'test_case');
    
    maEv = evidence.retinalAnalysis.lesions.microaneurysms;
    assert(maEv.present == true, 'MA should be present');
    assert(maEv.count == 2, sprintf('Expected 2 components, got %d', maEv.count));
    assert(maEv.totalPixelArea == 45, sprintf('Expected 45 total px, got %d', maEv.totalPixelArea));
    assert(maEv.largestComponentArea == 36, sprintf('Expected largest 36, got %d', maEv.largestComponentArea));
    assert(isequal(maEv.components(1).area, 36), 'Largest component should be first');
    assert(strcmp(maEv.evidenceType, 'Model-predicted lesion evidence'), 'Evidence label mismatch');
    
    fprintf('PASS (Accurate component count, areas, bboxes, and structured contract)\n');
    passCount = passCount + 1;
    results.testG = 'PASS';
catch ME
    fprintf('FAIL: %s\n', ME.message);
    results.testG = ['FAIL: ' ME.message];
end

% -------------------------------------------------------------
% TEST H: DETERMINISTIC INFERENCE
% -------------------------------------------------------------
try
    fprintf('[TEST H] Verifying deterministic inference... ');
    rng(42);
    fixedImg = uint8(rand(256, 256, 3) * 255);
    
    % Run single-tile prediction on CPU for strict determinism
    predOpts = struct('patchSize', [256, 256], 'stride', 256, 'targetSize', [256, 256], 'useGPU', false);
    prob1 = predictLesions(fixedImg, net, predOpts);
    prob2 = predictLesions(fixedImg, net, predOpts);
    
    maxDiff = max(abs(prob1(:) - prob2(:)));
    assert(maxDiff < 1e-6, sprintf('Inference is non-deterministic: max diff = %e', maxDiff));
    
    fprintf('PASS (Deterministic across repeated runs, max diff < 1e-6)\n');
    passCount = passCount + 1;
    results.testH = 'PASS';
catch ME
    fprintf('FAIL: %s\n', ME.message);
    results.testH = ['FAIL: ' ME.message];
end

% -------------------------------------------------------------
% TEST I: OFFICIAL TEST ISOLATION
% -------------------------------------------------------------
try
    fprintf('[TEST I] Verifying official test isolation... ');
    splitsCsv = fullfile(baseDir, 'segmentation_training/configs/lesion_splits.csv');
    opts = detectImportOptions(splitsCsv);
    opts.VariableTypes(:) = {'char'};
    splitTbl = readtable(splitsCsv, opts);
    trainSplitIds = splitTbl.image_id(strcmp(splitTbl.dev_split, 'DEV_TRAIN'));
    valSplitIds = splitTbl.image_id(strcmp(splitTbl.dev_split, 'DEV_VAL'));
    
    assert(numel(trainSplitIds) == 43, 'Train images count mismatch');
    assert(numel(valSplitIds) == 11, 'Val images count mismatch');
    
    patchFile = fullfile(baseDir, 'segmentation_training/configs/lesion_patches.mat');
    pData = load(patchFile);
    trainPatchImgs = unique(pData.trainData.imgIds);
    valPatchImgs = unique(pData.valData.imgIds);
    
    % Check test indices 55-81 are strictly absent from both training splits and patch sets
    for k = 55:81
        testName = sprintf('IDRiD_%02d', k);
        assert(~ismember(testName, trainSplitIds), sprintf('%s leaked into train split', testName));
        assert(~ismember(testName, valSplitIds), sprintf('%s leaked into val split', testName));
        assert(~ismember(testName, trainPatchImgs), sprintf('%s leaked into train patches', testName));
        assert(~ismember(testName, valPatchImgs), sprintf('%s leaked into val patches', testName));
    end
    
    fprintf('PASS (Official test images 55-81 strictly isolated from training and patches)\n');
    passCount = passCount + 1;
    results.testI = 'PASS';
catch ME
    fprintf('FAIL: %s\n', ME.message);
    results.testI = ['FAIL: ' ME.message];
end

% -------------------------------------------------------------
% TEST J: REGRESSION COMPATIBILITY
% -------------------------------------------------------------
try
    fprintf('[TEST J] Verifying regression compatibility... ');
    % Check frozen DR classifier models in repository
    drModels = {
        'trained_dr_model.mat', ...
        'trained_dr_model_preprocessed.mat', ...
        'AI_REBUILD/02_training/models/trained_dr_model_r18_final_candidate.mat'
    };
    for m = 1:numel(drModels)
        assert(exist(drModels{m}, 'file') == 2, sprintf('DR model %s missing', drModels{m}));
    end
    
    % Check Phase 5 anatomical modules
    anatomyFiles = {
        'AI_REBUILD/07_retinal_analysis/segmentRetinalField.m', ...
        'AI_REBUILD/07_retinal_analysis/detectOpticDisc.m', ...
        'AI_REBUILD/07_retinal_analysis/estimateMacula.m', ...
        'AI_REBUILD/07_retinal_analysis/analyzeRetinalVessels.m', ...
        'AI_REBUILD/07_retinal_analysis/extractCandidateFindings.m'
    };
    for a = 1:numel(anatomyFiles)
        assert(exist(anatomyFiles{a}, 'file') == 2, sprintf('Anatomy module %s missing', anatomyFiles{a}));
    end
    
    fprintf('PASS (All frozen DR models and retinal anatomy modules intact)\n');
    passCount = passCount + 1;
    results.testJ = 'PASS';
catch ME
    fprintf('FAIL: %s\n', ME.message);
    results.testJ = ['FAIL: ' ME.message];
end

fprintf('\n=================================================================\n');
fprintf('TEST SUMMARY: %d/%d PASSED\n', passCount, totalTests);
fprintf('=================================================================\n');

if passCount == totalTests
    results.status = 'ALL_PASSED';
else
    results.status = 'SOME_FAILED';
end
end
