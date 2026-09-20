function splitsTable = createLesionSplits(indexCsvPath, outCsvPath)
% CREATELESIONSPLITS
% Deterministically partitions the 54 official IDRiD training images into
% Development Train (80%, N=43) and Validation (20%, N=11).
% The 27 official test images are labeled 'OFFICIAL_TEST' and strictly held out.
%
% Stratification criteria:
%   - DR severity distribution
%   - Soft Exudate presence (se_mask_present)
%
% Output fields:
%   image_id, official_split, dev_split

scriptDir = fileparts(mfilename('fullpath'));
if nargin < 1 || isempty(indexCsvPath)
    indexCsvPath = fullfile(fileparts(scriptDir), 'idrid_segmentation_index.csv');
end
if nargin < 2 || isempty(outCsvPath)
    outCsvPath = fullfile(scriptDir, 'configs', 'lesion_splits.csv');
end

fprintf('===========================================================\n');
fprintf('  CREATING DETERMINISTIC LESION DATASET SPLITS             \n');
fprintf('===========================================================\n');

if ~exist(indexCsvPath, 'file')
    error('Segmentation index CSV missing: %s', indexCsvPath);
end

indexTable = readtable(indexCsvPath);
N = height(indexTable);
assert(N == 81, 'Expected 81 images in index, got %d', N);

trainMask = strcmp(indexTable.official_split, 'TRAIN');
testMask = strcmp(indexTable.official_split, 'TEST');

assert(sum(trainMask) == 54, 'Expected 54 official training images, got %d', sum(trainMask));
assert(sum(testMask) == 27, 'Expected 27 official testing images, got %d', sum(testMask));

trainRows = find(trainMask);
testRows = find(testMask);

rng(42, 'twister'); % Deterministic seed

% Check SE presence among training images for stratification
hasSE = logical(indexTable.se_mask_present(trainRows));
seTrainRows = trainRows(hasSE);   % 26 images
noSeTrainRows = trainRows(~hasSE); % 28 images

% Shuffle within each group
permSE = seTrainRows(randperm(length(seTrainRows)));
permNoSE = noSeTrainRows(randperm(length(noSeTrainRows)));

% 80/20 partition:
% For SE (26): 21 dev_train, 5 dev_val
% For non-SE (28): 22 dev_train, 6 dev_val
% Total: 43 dev_train (79.6%), 11 dev_val (20.4%)
valIdx = [permSE(1:5); permNoSE(1:6)];
trainIdx = [permSE(6:end); permNoSE(7:end)];

assert(length(trainIdx) == 43, 'Expected 43 dev_train images, got %d', length(trainIdx));
assert(length(valIdx) == 11, 'Expected 11 dev_val images, got %d', length(valIdx));
assert(isempty(intersect(trainIdx, valIdx)), 'Leakage between dev_train and dev_val!');

dev_split = repmat({'OFFICIAL_TEST'}, N, 1);
dev_split(trainIdx) = {'DEV_TRAIN'};
dev_split(valIdx) = {'DEV_VAL'};

splitsTable = table(indexTable.image_id, indexTable.official_split, dev_split, ...
    'VariableNames', {'image_id', 'official_split', 'dev_split'});

outDir = fileparts(outCsvPath);
if ~exist(outDir, 'dir')
    mkdir(outDir);
end
writetable(splitsTable, outCsvPath);

fprintf('Lesion Splits Table saved to:\n  %s\n', outCsvPath);
fprintf('  DEV_TRAIN:     %d images (80%% of official train)\n', length(trainIdx));
fprintf('  DEV_VAL:       %d images (20%% of official train)\n', length(valIdx));
fprintf('  OFFICIAL_TEST: %d images (100%% held-out final evaluation)\n', length(testRows));
fprintf('===========================================================\n');
end
