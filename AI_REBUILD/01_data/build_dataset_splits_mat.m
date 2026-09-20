function build_dataset_splits_mat()
% BUILD_DATASET_SPLITS_MAT
% Loads AI_REBUILD/01_data/dataset_splits.csv and exports dataset_splits.mat
% containing cell arrays / string arrays:
%   trainIds
%   calibrationIds
%   testIds

dataDir = fileparts(mfilename('fullpath'));
csvPath = fullfile(dataDir, 'dataset_splits.csv');
matPath = fullfile(dataDir, 'dataset_splits.mat');

if ~exist(csvPath, 'file')
    error('dataset_splits.csv not found at: %s', csvPath);
end

opts = detectImportOptions(csvPath, 'TextType', 'string');
T = readtable(csvPath, opts);

trainIds = string(T.id_code(T.split == "TRAIN"));
calibrationIds = string(T.id_code(T.split == "CALIBRATION"));
testIds = string(T.id_code(T.split == "TEST"));

fprintf('Total split rows in CSV: %d\n', height(T));
fprintf('  Train IDs:       %d\n', numel(trainIds));
fprintf('  Calibration IDs: %d\n', numel(calibrationIds));
fprintf('  Test IDs:        %d\n', numel(testIds));

save(matPath, 'trainIds', 'calibrationIds', 'testIds');
fprintf('Successfully saved: %s\n', matPath);

end
