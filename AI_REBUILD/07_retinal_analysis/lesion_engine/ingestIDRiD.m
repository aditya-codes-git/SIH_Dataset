function report = ingestIDRiD(sourceDir, outDir)
% INGESTIDRID
% Master ingestion routine for IDRiD dataset.
% Discovers images, builds canonical index, creates stratified 70/15/15 splits,
% verifies zero leakage, and exports dataset metadata.
%
% Usage:
%   report = ingestIDRiD('D:\SIH_Dataset\IDRID');

if nargin < 1 || isempty(sourceDir)
    sourceDir = 'D:\SIH_Dataset\IDRID';
end
if nargin < 2 || isempty(outDir)
    outDir = fileparts(mfilename('fullpath'));
end

fprintf('===========================================================\n');
fprintf('  STARTING IDRiD DATASET INGESTION & REGISTRATION PIPELINE \n');
fprintf('===========================================================\n');

%% 1. Build Canonical Index
indexCsvPath = fullfile(outDir, 'idrid_index.csv');
[indexTable, stats] = buildIDRiDIndex(sourceDir, indexCsvPath);

%% 2. Generate Deterministic Stratified 70/15/15 Split
splitsCsvPath = fullfile(outDir, 'idrid_splits.csv');

rng(42, 'twister'); % Deterministic seed for reproducible partition

numImages = height(indexTable);
splitCol = repmat({'UNASSIGNED'}, numImages, 1);

% Stratify across available DR diagnosis grades (0 to 4)
for g = 0:4
    gIdx = find(indexTable.diagnosis == g);
    nG = length(gIdx);
    
    if nG == 0
        continue;
    end
    
    permG = gIdx(randperm(nG));
    
    nTrain = round(0.70 * nG);
    nVal = round(0.15 * nG);
    % Remaining to test to guarantee sum equals nG
    nTest = nG - nTrain - nVal;
    
    trainIdx = permG(1:nTrain);
    valIdx = permG(nTrain+1 : nTrain+nVal);
    testIdx = permG(nTrain+nVal+1 : end);
    
    splitCol(trainIdx) = {'TRAIN'};
    splitCol(valIdx) = {'VALIDATION'};
    splitCol(testIdx) = {'TEST'};
end

% Check if any unassigned (e.g. if diagnosis is NaN)
unassignedIdx = find(strcmp(splitCol, 'UNASSIGNED'));
if ~isempty(unassignedIdx)
    nUn = length(unassignedIdx);
    permUn = unassignedIdx(randperm(nUn));
    nTr = round(0.70 * nUn);
    nV = round(0.15 * nUn);
    splitCol(permUn(1:nTr)) = {'TRAIN'};
    splitCol(permUn(nTr+1 : nTr+nV)) = {'VALIDATION'};
    splitCol(permUn(nTr+nV+1 : end)) = {'TEST'};
end

splitsTable = table(indexTable.imageId, splitCol, 'VariableNames', {'imageId', 'split'});
writetable(splitsTable, splitsCsvPath);
fprintf('IDRiD Splits Table exported to:\n  %s\n', splitsCsvPath);

%% 3. Verify Splits and Enforce Zero Leakage
verifyIDRiDSplits(splitsCsvPath, indexCsvPath);

%% 4. Initialize Validation Gallery
galleryDir = fullfile(outDir, 'validation_gallery');
if ~exist(galleryDir, 'dir')
    mkdir(galleryDir);
end

%% 5. Compile Final Ingestion Report
report = struct();
report.sourcePath = sourceDir;
report.totalImages = numImages;
report.width = stats.width;
report.height = stats.height;
report.diagnosisCounts = stats.grades;
report.dmeRiskCounts = stats.dmeRisks;
report.annotations = struct(...
    'microaneurysm', stats.numMA, ...
    'hemorrhage', stats.numHE, ...
    'hardExudate', stats.numEX, ...
    'softExudate', stats.numSE, ...
    'opticDisc', stats.numOD, ...
    'fovea', 0);
report.splitCounts = struct(...
    'train', sum(strcmp(splitCol, 'TRAIN')), ...
    'validation', sum(strcmp(splitCol, 'VALIDATION')), ...
    'test', sum(strcmp(splitCol, 'TEST')));
report.leakagePassed = true;

fprintf('\n===========================================================\n');
fprintf('  IDRiD INGESTION COMPLETE: %d IMAGES REGISTERED          \n', numImages);
fprintf('  Train: %d | Val: %d | Test: %d\n', ...
    report.splitCounts.train, report.splitCounts.validation, report.splitCounts.test);
fprintf('===========================================================\n');
end
