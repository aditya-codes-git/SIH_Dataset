function [indexTable, statusReport] = buildIDRiDSegmentationIndex(sourceDir, outCsvPath)
% BUILDIDRIDSEGMENTATIONINDEX
% Discovers and indexes the official IDRiD Pixel-Level Lesion Segmentation
% dataset ("A. Segmentation").
%
% Recursively discovers:
%   - 1. Original Images (a. Training Set: 54, b. Testing Set: 27)
%   - 2. All Segmentation Groundtruths (MA, HE, EX, SE, OD)
%
% Output Table Columns:
%   image_id, image_path, official_split, image_width, image_height, image_channels,
%   ma_mask_path, he_mask_path, ex_mask_path, se_mask_path, optic_disc_mask_path,
%   ma_mask_present, he_mask_present, ex_mask_present, se_mask_present, optic_disc_mask_present,
%   ma_foreground_pixels, he_foreground_pixels, ex_foreground_pixels, se_foreground_pixels,
%   optic_disc_foreground_pixels

if nargin < 1 || isempty(sourceDir)
    sourceDir = 'D:\SIH_Dataset\IDRID\A. Segmentation';
end
if nargin < 2 || isempty(outCsvPath)
    scriptDir = fileparts(mfilename('fullpath'));
    outCsvPath = fullfile(scriptDir, 'idrid_segmentation_index.csv');
end

fprintf('===========================================================\n');
fprintf('  DISCOVERING & INDEXING IDRiD LESION SEGMENTATION DATASET \n');
fprintf('===========================================================\n');
fprintf('Search Path: %s\n', sourceDir);

statusReport = struct();
statusReport.found = false;
statusReport.originalImages = 0;
statusReport.officialTrain = 0;
statusReport.officialTest = 0;
statusReport.maMasks = 0;
statusReport.heMasks = 0;
statusReport.exMasks = 0;
statusReport.seMasks = 0;
statusReport.odMasks = 0;
statusReport.mismatches = 0;
statusReport.emptyMasks = 0;
statusReport.duplicateIds = 0;
statusReport.sourceModified = false;
statusReport.leakagePassed = true;

%% 1. Recursive Discovery of Original Images and Groundtruth Folders
trainImgDir = '';
testImgDir = '';

trainDirs = dir(fullfile(sourceDir, '**', '*Training Set*'));
for i = 1:length(trainDirs)
    p = fullfile(trainDirs(i).folder, trainDirs(i).name);
    if contains(p, 'Original Images')
        trainImgDir = p;
        break;
    end
end

testDirs = dir(fullfile(sourceDir, '**', '*Testing Set*'));
for i = 1:length(testDirs)
    p = fullfile(testDirs(i).folder, testDirs(i).name);
    if contains(p, 'Original Images')
        testImgDir = p;
        break;
    end
end

if isempty(trainImgDir) || isempty(testImgDir)
    error('Could not locate Original Images training/testing directories under %s', sourceDir);
end

trainImgs = dir(fullfile(trainImgDir, '*.jpg'));
[~, sIdx] = sort({trainImgs.name});
trainImgs = trainImgs(sIdx);

testImgs = dir(fullfile(testImgDir, '*.jpg'));
[~, sIdx] = sort({testImgs.name});
testImgs = testImgs(sIdx);

nTrain = length(trainImgs);
nTest = length(testImgs);
N = nTrain + nTest;

fprintf('Discovered Original Images: %d total (Train: %d, Test: %d)\n', N, nTrain, nTest);
statusReport.found = true;
statusReport.originalImages = N;
statusReport.officialTrain = nTrain;
statusReport.officialTest = nTest;

%% 2. Locate Groundtruth Class Directories (Train & Test)
% Identify base groundtruth root
gtRoots = dir(fullfile(sourceDir, '**', '*All Segmentation Groundtruths*'));
if isempty(gtRoots)
    error('Could not locate All Segmentation Groundtruths directory under %s', sourceDir);
end
gtBase = fullfile(gtRoots(1).folder, gtRoots(1).name);

% Helper to locate class directory under train or test
findClassDir = @(splitName, classKeyword) getSubDir(gtBase, splitName, classKeyword);

gtDirs = struct();
gtDirs.train.MA = findClassDir('Training Set', 'Microaneurysms');
gtDirs.train.HE = findClassDir('Training Set', 'Haemorrhages');
gtDirs.train.EX = findClassDir('Training Set', 'Hard Exudates');
gtDirs.train.SE = findClassDir('Training Set', 'Soft Exudates');
gtDirs.train.OD = findClassDir('Training Set', 'Optic Disc');

gtDirs.test.MA = findClassDir('Testing Set', 'Microaneurysms');
gtDirs.test.HE = findClassDir('Testing Set', 'Haemorrhages');
gtDirs.test.EX = findClassDir('Testing Set', 'Hard Exudates');
gtDirs.test.SE = findClassDir('Testing Set', 'Soft Exudates');
gtDirs.test.OD = findClassDir('Testing Set', 'Optic Disc');

%% 3. Iterate Images and Build Index Table
image_id = cell(N, 1);
image_path = cell(N, 1);
official_split = cell(N, 1);
image_width = zeros(N, 1);
image_height = zeros(N, 1);
image_channels = zeros(N, 1);

ma_mask_path = cell(N, 1);
he_mask_path = cell(N, 1);
ex_mask_path = cell(N, 1);
se_mask_path = cell(N, 1);
optic_disc_mask_path = cell(N, 1);

ma_mask_present = false(N, 1);
he_mask_present = false(N, 1);
ex_mask_present = false(N, 1);
se_mask_present = false(N, 1);
optic_disc_mask_present = false(N, 1);

ma_foreground_pixels = zeros(N, 1);
he_foreground_pixels = zeros(N, 1);
ex_foreground_pixels = zeros(N, 1);
se_foreground_pixels = zeros(N, 1);
optic_disc_foreground_pixels = zeros(N, 1);

allImgList = [trainImgs; testImgs];
splitsList = [repmat({'TRAIN'}, nTrain, 1); repmat({'TEST'}, nTest, 1)];

for i = 1:N
    imgInfo = allImgList(i);
    splitName = splitsList{i};
    [~, baseId, ~] = fileparts(imgInfo.name);
    
    image_id{i} = baseId;
    image_path{i} = fullfile(imgInfo.folder, imgInfo.name);
    official_split{i} = splitName;
    
    inf = imfinfo(image_path{i});
    image_width(i) = inf.Width;
    image_height(i) = inf.Height;
    image_channels(i) = inf.BitDepth / 8;
    
    if strcmp(splitName, 'TRAIN')
        cDirs = gtDirs.train;
    else
        cDirs = gtDirs.test;
    end
    
    % Check each lesion class
    [ma_mask_path{i}, ma_mask_present(i), ma_foreground_pixels(i)] = processMask(cDirs.MA, baseId, 'MA');
    [he_mask_path{i}, he_mask_present(i), he_foreground_pixels(i)] = processMask(cDirs.HE, baseId, 'HE');
    [ex_mask_path{i}, ex_mask_present(i), ex_foreground_pixels(i)] = processMask(cDirs.EX, baseId, 'EX');
    [se_mask_path{i}, se_mask_present(i), se_foreground_pixels(i)] = processMask(cDirs.SE, baseId, 'SE');
    [optic_disc_mask_path{i}, optic_disc_mask_present(i), optic_disc_foreground_pixels(i)] = processMask(cDirs.OD, baseId, 'OD');
end

indexTable = table(image_id, image_path, official_split, image_width, image_height, image_channels, ...
    ma_mask_path, he_mask_path, ex_mask_path, se_mask_path, optic_disc_mask_path, ...
    ma_mask_present, he_mask_present, ex_mask_present, se_mask_present, optic_disc_mask_present, ...
    ma_foreground_pixels, he_foreground_pixels, ex_foreground_pixels, se_foreground_pixels, ...
    optic_disc_foreground_pixels);

%% 4. Save Canonical Index CSV
outDir = fileparts(outCsvPath);
if ~isempty(outDir) && ~exist(outDir, 'dir')
    mkdir(outDir);
end

writetable(indexTable, outCsvPath);
fprintf('Canonical IDRiD Segmentation Index saved to:\n  %s\n', outCsvPath);

%% 5. Update Status Report
statusReport.maMasks = sum(ma_mask_present);
statusReport.heMasks = sum(he_mask_present);
statusReport.exMasks = sum(ex_mask_present);
statusReport.seMasks = sum(se_mask_present);
statusReport.odMasks = sum(optic_disc_mask_present);
statusReport.emptyMasks = sum((ma_mask_present & ma_foreground_pixels == 0) | ...
                              (he_mask_present & he_foreground_pixels == 0) | ...
                              (ex_mask_present & ex_foreground_pixels == 0) | ...
                              (se_mask_present & se_foreground_pixels == 0) | ...
                              (optic_disc_mask_present & optic_disc_foreground_pixels == 0));
statusReport.duplicateIds = N - length(unique(image_id));

fprintf('\nSegmentation Mask Summary:\n');
fprintf(' - MA masks: %d / %d (Total FG Pixels: %d)\n', statusReport.maMasks, N, sum(ma_foreground_pixels));
fprintf(' - HE masks: %d / %d (Total FG Pixels: %d)\n', statusReport.heMasks, N, sum(he_foreground_pixels));
fprintf(' - EX masks: %d / %d (Total FG Pixels: %d)\n', statusReport.exMasks, N, sum(ex_foreground_pixels));
fprintf(' - SE masks: %d / %d (Total FG Pixels: %d)\n', statusReport.seMasks, N, sum(se_foreground_pixels));
fprintf(' - OD masks: %d / %d (Total FG Pixels: %d)\n', statusReport.odMasks, N, sum(optic_disc_foreground_pixels));
fprintf(' - Empty Masks (FG == 0): %d\n', statusReport.emptyMasks);
fprintf(' - Duplicate IDs: %d\n', statusReport.duplicateIds);
end

function subDirPath = getSubDir(basePath, splitPattern, classPattern)
subDirPath = '';
dirs = dir(fullfile(basePath, '**', sprintf('*%s*', classPattern)));
dirs = dirs([dirs.isdir]);
for k = 1:length(dirs)
    fullP = fullfile(dirs(k).folder, dirs(k).name);
    if contains(fullP, splitPattern)
        subDirPath = fullP;
        return;
    end
end
end

function [maskPath, isPresent, fgCount] = processMask(classDir, baseId, classCode)
maskPath = 'NA';
isPresent = false;
fgCount = 0;

if isempty(classDir) || ~exist(classDir, 'dir')
    return;
end

expectedName = sprintf('%s_%s.tif', baseId, classCode);
candidatePath = fullfile(classDir, expectedName);

if exist(candidatePath, 'file')
    maskPath = candidatePath;
    isPresent = true;
    m = imread(candidatePath);
    fgCount = sum(m(:) > 0);
end
end
