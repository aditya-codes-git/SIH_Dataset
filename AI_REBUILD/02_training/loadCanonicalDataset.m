function [imds, idCodes, labels] = loadCanonicalDataset(splitName, useProcessed)
% LOADCANONICALDATASET
% Loads the canonical dataset split specified by splitName ('TRAIN', 'CALIBRATION', or 'TEST')
% using AI_REBUILD/01_data/dataset_splits.csv.
%
% Inputs:
%   splitName    - 'TRAIN', 'CALIBRATION', or 'TEST' (case-insensitive)
%   useProcessed - (Optional, default true) Use preprocessed 224x224 images in processed_train_images/
%
% Outputs:
%   imds         - MATLAB imageDatastore with validated files and categorical labels (0..4)
%   idCodes      - String array of image ID codes
%   labels       - Categorical array of labels (0 to 4)

if nargin < 2 || isempty(useProcessed)
    useProcessed = true;
end

splitName = upper(string(splitName));
validSplits = ["TRAIN", "CALIBRATION", "TEST"];
if ~ismember(splitName, validSplits)
    error('splitName must be one of: "TRAIN", "CALIBRATION", "TEST" (received: %s)', splitName);
end

% Locate dataset_splits.csv relative to script
baseDir = fileparts(mfilename('fullpath'));
csvPath = fullfile(baseDir, '..', '01_data', 'dataset_splits.csv');

if ~exist(csvPath, 'file')
    error('Canonical split file not found at: %s', csvPath);
end

opts = detectImportOptions(csvPath, 'TextType', 'string');
T = readtable(csvPath, opts);

% Filter for requested split
mask = (T.split == splitName);
splitTable = T(mask, :);
N = height(splitTable);

if N == 0
    error('No records found for split: %s', splitName);
end

workspaceRoot = fullfile(baseDir, '..', '..');
if useProcessed
    imgFolder = fullfile(workspaceRoot, 'processed_train_images');
else
    imgFolder = fullfile(workspaceRoot, 'train_images');
end

filePaths = cell(N, 1);
for i = 1:N
    filePaths{i} = fullfile(imgFolder, [char(splitTable.id_code(i)), '.png']);
    if ~exist(filePaths{i}, 'file')
        error('Image file missing: %s (ID: %s)', filePaths{i}, splitTable.id_code(i));
    end
end

idCodes = splitTable.id_code;
labels = categorical(splitTable.diagnosis, 0:4);

imds = imageDatastore(filePaths);
imds.Labels = labels;

fprintf('[CANONICAL DATASET] Loaded %s split: %d images (Folder: %s)\n', ...
    splitName, N, imgFolder);

end
