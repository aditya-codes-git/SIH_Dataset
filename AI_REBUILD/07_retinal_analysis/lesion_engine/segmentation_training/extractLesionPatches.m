function [trainData, valData] = extractLesionPatches(indexCsvPath, splitsCsvPath, outMatPath, opts)
% EXTRACTLESIONPATCHES
% Extracts lesion-aware patches from DEV_TRAIN and DEV_VAL images independently.
% Enforces strict zero-leakage: Images are partitioned BEFORE patch extraction.
%
% Patch extraction parameters:
%   - Patch size: [256, 256, 3]
%   - Resolution: 2144 x 1424 (2x downscaled from native 4288x2848 to preserve
%     microaneurysm fidelity while enabling fast, balanced GPU training).
%   - Sampling: Balanced lesion-centric (70%) + retinal context/background (30%).
%
% Outputs:
%   trainData: struct with fields X [256x256x3xN], Y [256x256x4xN], imgIds, isSEAnnotated
%   valData:   struct with fields X, Y, imgIds, isSEAnnotated

scriptDir = fileparts(mfilename('fullpath'));
if nargin < 1 || isempty(indexCsvPath)
    indexCsvPath = fullfile(fileparts(scriptDir), 'idrid_segmentation_index.csv');
end
if nargin < 2 || isempty(splitsCsvPath)
    splitsCsvPath = fullfile(scriptDir, 'configs', 'lesion_splits.csv');
end
if nargin < 3 || isempty(outMatPath)
    outMatPath = fullfile(scriptDir, 'configs', 'lesion_patches.mat');
end
if nargin < 4 || isempty(opts)
    opts = struct();
end

if ~isfield(opts, 'patchSize'), opts.patchSize = [256, 256]; end
if ~isfield(opts, 'targetImgSize'), opts.targetImgSize = [1424, 2144]; end % [H, W]
if ~isfield(opts, 'trainPatchesPerImg'), opts.trainPatchesPerImg = 16; end
if ~isfield(opts, 'valPatchesPerImg'), opts.valPatchesPerImg = 16; end

fprintf('===========================================================\n');
fprintf('  EXTRACTING LESION-AWARE PATCHES (ZERO LEAKAGE GATE)      \n');
fprintf('===========================================================\n');

indexTable = readtable(indexCsvPath);
splitsTable = readtable(splitsCsvPath);

% Match splits
[~, loc] = ismember(indexTable.image_id, splitsTable.image_id);
devSplits = splitsTable.dev_split(loc);

trainIdx = find(strcmp(devSplits, 'DEV_TRAIN'));
valIdx = find(strcmp(devSplits, 'DEV_VAL'));

fprintf('Partition counts:\n');
fprintf('  DEV_TRAIN: %d source images (patches will be strictly train-only)\n', length(trainIdx));
fprintf('  DEV_VAL:   %d source images (patches will be strictly val-only)\n', length(valIdx));

pH = opts.patchSize(1);
pW = opts.patchSize(2);
tH = opts.targetImgSize(1);
tW = opts.targetImgSize(2);

%% 1. Extract Training Patches
fprintf('\nExtracting patches for DEV_TRAIN (%d images)...\n', length(trainIdx));
numTrainPatches = length(trainIdx) * opts.trainPatchesPerImg;
trainX = zeros(pH, pW, 3, numTrainPatches, 'single');
trainY = zeros(pH, pW, 4, numTrainPatches, 'single');
trainImgIds = cell(numTrainPatches, 1);
trainHasSE = false(numTrainPatches, 1);

rng(101, 'twister'); % Reproducible patch sampling
patchCounter = 0;

for k = 1:length(trainIdx)
    row = trainIdx(k);
    imgId = indexTable.image_id{row};
    imgPath = indexTable.image_path{row};
    
    rawImg = imread(imgPath);
    imgResized = imresize(rawImg, [tH, tW]);
    imgNorm = single(imgResized) / 255;
    
    % Load all 4 masks
    mMA = loadMask(indexTable.ma_mask_path{row}, [tH, tW]);
    mHE = loadMask(indexTable.he_mask_path{row}, [tH, tW]);
    mEX = loadMask(indexTable.ex_mask_path{row}, [tH, tW]);
    mSE = loadMask(indexTable.se_mask_path{row}, [tH, tW]);
    hasSE = indexTable.se_mask_present(row);
    
    allLesions = (mMA | mHE | mEX | mSE);
    [lesionR, lesionC] = find(allLesions);
    hasLesions = ~isempty(lesionR);
    
    % Sample patches
    nLesion = round(0.70 * opts.trainPatchesPerImg);
    nBg = opts.trainPatchesPerImg - nLesion;
    
    for p = 1:opts.trainPatchesPerImg
        patchCounter = patchCounter + 1;
        
        if p <= nLesion && hasLesions
            % Pick random lesion coordinate
            ptIdx = randi(length(lesionR));
            cR = lesionR(ptIdx);
            cC = lesionC(ptIdx);
            % Add small jitter
            cR = cR + randi([-30, 30]);
            cC = cC + randi([-30, 30]);
        else
            % Random position within retinal field (center region)
            cR = randi([round(0.2*tH), round(0.8*tH)]);
            cC = randi([round(0.2*tW), round(0.8*tW)]);
        end
        
        % Crop bounds with clamping
        r1 = max(1, min(tH - pH + 1, cR - round(pH/2)));
        c1 = max(1, min(tW - pW + 1, cC - round(pW/2)));
        r2 = r1 + pH - 1;
        c2 = c1 + pW - 1;
        
        trainX(:, :, :, patchCounter) = imgNorm(r1:r2, c1:c2, :);
        trainY(:, :, 1, patchCounter) = single(mMA(r1:r2, c1:c2));
        trainY(:, :, 2, patchCounter) = single(mHE(r1:r2, c1:c2));
        trainY(:, :, 3, patchCounter) = single(mEX(r1:r2, c1:c2));
        trainY(:, :, 4, patchCounter) = single(mSE(r1:r2, c1:c2));
        trainImgIds{patchCounter} = imgId;
        trainHasSE(patchCounter) = hasSE;
    end
end
trainX = trainX(:, :, :, 1:patchCounter);
trainY = trainY(:, :, :, 1:patchCounter);
trainImgIds = trainImgIds(1:patchCounter);
trainHasSE = trainHasSE(1:patchCounter);

%% 2. Extract Validation Patches
fprintf('Extracting patches for DEV_VAL (%d images)...\n', length(valIdx));
numValPatches = length(valIdx) * opts.valPatchesPerImg;
valX = zeros(pH, pW, 3, numValPatches, 'single');
valY = zeros(pH, pW, 4, numValPatches, 'single');
valImgIds = cell(numValPatches, 1);
valHasSE = false(numValPatches, 1);

rng(202, 'twister'); % Deterministic validation patch sampling
patchCounter = 0;

for k = 1:length(valIdx)
    row = valIdx(k);
    imgId = indexTable.image_id{row};
    imgPath = indexTable.image_path{row};
    
    rawImg = imread(imgPath);
    imgResized = imresize(rawImg, [tH, tW]);
    imgNorm = single(imgResized) / 255;
    
    mMA = loadMask(indexTable.ma_mask_path{row}, [tH, tW]);
    mHE = loadMask(indexTable.he_mask_path{row}, [tH, tW]);
    mEX = loadMask(indexTable.ex_mask_path{row}, [tH, tW]);
    mSE = loadMask(indexTable.se_mask_path{row}, [tH, tW]);
    hasSE = indexTable.se_mask_present(row);
    
    allLesions = (mMA | mHE | mEX | mSE);
    [lesionR, lesionC] = find(allLesions);
    hasLesions = ~isempty(lesionR);
    
    nLesion = round(0.70 * opts.valPatchesPerImg);
    
    for p = 1:opts.valPatchesPerImg
        patchCounter = patchCounter + 1;
        
        if p <= nLesion && hasLesions
            ptIdx = randi(length(lesionR));
            cR = lesionR(ptIdx);
            cC = lesionC(ptIdx);
        else
            cR = randi([round(0.2*tH), round(0.8*tH)]);
            cC = randi([round(0.2*tW), round(0.8*tW)]);
        end
        
        r1 = max(1, min(tH - pH + 1, cR - round(pH/2)));
        c1 = max(1, min(tW - pW + 1, cC - round(pW/2)));
        r2 = r1 + pH - 1;
        c2 = c1 + pW - 1;
        
        valX(:, :, :, patchCounter) = imgNorm(r1:r2, c1:c2, :);
        valY(:, :, 1, patchCounter) = single(mMA(r1:r2, c1:c2));
        valY(:, :, 2, patchCounter) = single(mHE(r1:r2, c1:c2));
        valY(:, :, 3, patchCounter) = single(mEX(r1:r2, c1:c2));
        valY(:, :, 4, patchCounter) = single(mSE(r1:r2, c1:c2));
        valImgIds{patchCounter} = imgId;
        valHasSE(patchCounter) = hasSE;
    end
end
valX = valX(:, :, :, 1:patchCounter);
valY = valY(:, :, :, 1:patchCounter);
valImgIds = valImgIds(1:patchCounter);
valHasSE = valHasSE(1:patchCounter);

%% 3. Verify Zero Cross-Contamination
trainUnique = unique(trainImgIds);
valUnique = unique(valImgIds);
overlap = intersect(trainUnique, valUnique);
assert(isempty(overlap), 'CRITICAL ERROR: Patch cross-contamination detected between train and val!');

fprintf('\nPatch Extraction Complete:\n');
fprintf('  Train Patches: %d ([%dx%dx%dx%d])\n', size(trainX, 4), pH, pW, 3, size(trainX, 4));
fprintf('  Val Patches:   %d ([%dx%dx%dx%d])\n', size(valX, 4), pH, pW, 3, size(valX, 4));
fprintf('  Zero patch leakage across splits: PASSED\n');

trainData = struct('X', trainX, 'Y', trainY, 'imgIds', {trainImgIds}, 'hasSE', trainHasSE);
valData = struct('X', valX, 'Y', valY, 'imgIds', {valImgIds}, 'hasSE', valHasSE);

outDir = fileparts(outMatPath);
if ~exist(outDir, 'dir')
    mkdir(outDir);
end
save(outMatPath, 'trainData', 'valData', '-v7.3');
fprintf('Saved patches to: %s\n', outMatPath);
end

function m = loadMask(maskPath, targetSize)
if isempty(maskPath) || strcmp(maskPath, 'NA') || ~exist(maskPath, 'file')
    m = false(targetSize);
    return;
end
raw = imread(maskPath);
m = imresize(raw > 0, targetSize, 'nearest');
end
