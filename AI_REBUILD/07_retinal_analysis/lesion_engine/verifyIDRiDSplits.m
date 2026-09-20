function passed = verifyIDRiDSplits(splitsCsvPath, indexCsvPath)
% VERIFYIDRIDSPLITS
% Programmatically verifies the integrity of the IDRiD train/val/test splits.
% Fails loudly if any data leakage, duplicate image IDs, or overlap is detected.
%
% Usage:
%   passed = verifyIDRiDSplits(splitsCsvPath, indexCsvPath);

if nargin < 1 || isempty(splitsCsvPath)
    scriptDir = fileparts(mfilename('fullpath'));
    splitsCsvPath = fullfile(scriptDir, 'idrid_splits.csv');
end
if nargin < 2 || isempty(indexCsvPath)
    scriptDir = fileparts(mfilename('fullpath'));
    indexCsvPath = fullfile(scriptDir, 'idrid_index.csv');
end

fprintf('===========================================================\n');
fprintf('  VERIFYING IDRiD DATASET SPLITS INTEGRITY & LEAKAGE GATE  \n');
fprintf('===========================================================\n');

if ~exist(splitsCsvPath, 'file')
    error('Splits file does not exist: %s', splitsCsvPath);
end

splitsTable = readtable(splitsCsvPath);
assert(ismember('imageId', splitsTable.Properties.VariableNames), 'splits CSV missing imageId column');
assert(ismember('split', splitsTable.Properties.VariableNames), 'splits CSV missing split column');

totalRows = height(splitsTable);
fprintf('Total images in splits table: %d\n', totalRows);

%% 1. Check for Duplicate Image IDs
uniqueIds = unique(splitsTable.imageId);
if length(uniqueIds) ~= totalRows
    error('DATA LEAKAGE DETECTED: Duplicate imageId found in splits! (%d unique out of %d total)', ...
        length(uniqueIds), totalRows);
end
fprintf('[CHECK 1] Unique image IDs across entire dataset: PASSED (%d unique)\n', length(uniqueIds));

%% 2. Partition Verification
trainMask = strcmp(splitsTable.split, 'TRAIN');
valMask = strcmp(splitsTable.split, 'VALIDATION');
testMask = strcmp(splitsTable.split, 'TEST');

trainIds = splitsTable.imageId(trainMask);
valIds = splitsTable.imageId(valMask);
testIds = splitsTable.imageId(testMask);

fprintf('Split Counts:\n');
fprintf(' - TRAIN:      %d (%.1f%%)\n', length(trainIds), 100 * length(trainIds) / totalRows);
fprintf(' - VALIDATION: %d (%.1f%%)\n', length(valIds), 100 * length(valIds) / totalRows);
fprintf(' - TEST:       %d (%.1f%%)\n', length(testIds), 100 * length(testIds) / totalRows);

assert(length(trainIds) + length(valIds) + length(testIds) == totalRows, ...
    'Sum of split sizes does not equal total images!');

%% 3. Mutual Exclusivity (Zero Cross-Split Overlap)
trainValOverlap = intersect(trainIds, valIds);
if ~isempty(trainValOverlap)
    error('DATA LEAKAGE CRITICAL: Train and Validation sets share %d images!', length(trainValOverlap));
end

trainTestOverlap = intersect(trainIds, testIds);
if ~isempty(trainTestOverlap)
    error('DATA LEAKAGE CRITICAL: Train and Test sets share %d images!', length(trainTestOverlap));
end

valTestOverlap = intersect(valIds, testIds);
if ~isempty(valTestOverlap)
    error('DATA LEAKAGE CRITICAL: Validation and Test sets share %d images!', length(valTestOverlap));
end
fprintf('[CHECK 2] Zero cross-split overlap (Train ∩ Val = ∅, Train ∩ Test = ∅, Val ∩ Test = ∅): PASSED\n');

%% 4. Match Against Canonical Index
if exist(indexCsvPath, 'file')
    indexTable = readtable(indexCsvPath);
    missingInIndex = setdiff(splitsTable.imageId, indexTable.imageId);
    missingInSplits = setdiff(indexTable.imageId, splitsTable.imageId);
    
    assert(isempty(missingInIndex), 'Splits contain IDs not in canonical index!');
    assert(isempty(missingInSplits), 'Index contains IDs not assigned to any split!');
    fprintf('[CHECK 3] 100%% bijection with canonical index: PASSED\n');
end

%% 5. Proportional Ratio Bounds
trainRatio = length(trainIds) / totalRows;
valRatio = length(valIds) / totalRows;
testRatio = length(testIds) / totalRows;

assert(trainRatio >= 0.65 && trainRatio <= 0.75, 'Train ratio outside [65%, 75%]');
assert(valRatio >= 0.10 && valRatio <= 0.20, 'Validation ratio outside [10%, 20%]');
assert(testRatio >= 0.10 && testRatio <= 0.20, 'Test ratio outside [10%, 20%]');
fprintf('[CHECK 4] Split ratios conform to target distribution: PASSED\n');

fprintf('\n===========================================================\n');
fprintf('  ALL IDRiD SPLIT INTEGRITY CHECKS PASSED (ZERO LEAKAGE)   \n');
fprintf('===========================================================\n');

passed = true;
end
