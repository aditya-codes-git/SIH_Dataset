function dataset_index = build_dataset_index()
% BUILD_DATASET_INDEX
% Builds canonical dataset index from AI_REBUILD/01_data/train_corrected.csv
%
% Outputs:
%   - AI_REBUILD/01_data/dataset_index.mat (stores table 'dataset_index')
%   - AI_REBUILD/01_data/dataset_index.csv
%
% Schema:
%   id_code   (string)
%   diagnosis (int32 / categorical)
%   filepath  (string)

dataDir = fileparts(mfilename('fullpath'));
correctedCsvPath = fullfile(dataDir, 'train_corrected.csv');

if ~exist(correctedCsvPath, 'file')
    error('train_corrected.csv not found at: %s', correctedCsvPath);
end

fprintf('Loading corrected metadata from: %s\n', correctedCsvPath);
opts = detectImportOptions(correctedCsvPath, 'TextType', 'string');
dataset_index = readtable(correctedCsvPath, opts);

numRows = height(dataset_index);
fprintf('Total index records: %d\n', numRows);

% Verify each file exists on disk
missingCount = 0;
for i = 1:numRows
    fPath = char(dataset_index.filepath(i));
    if ~exist(fPath, 'file')
        % Try relative to workspace root if relative path
        if ~exist(fullfile(dataDir, '..', '..', fPath), 'file')
            warning('File does not exist: %s (ID: %s)', fPath, dataset_index.id_code(i));
            missingCount = missingCount + 1;
        end
    end
end

if missingCount > 0
    error('Dataset index verification failed: %d missing files detected!', missingCount);
end

% Save dataset_index.mat
matOutputPath = fullfile(dataDir, 'dataset_index.mat');
save(matOutputPath, 'dataset_index');
fprintf('Saved canonical index MAT: %s\n', matOutputPath);

% Save dataset_index.csv
csvOutputPath = fullfile(dataDir, 'dataset_index.csv');
writetable(dataset_index, csvOutputPath);
fprintf('Saved canonical index CSV: %s\n', csvOutputPath);

fprintf('===========================================================\n');
fprintf('   CANONICAL DATASET INDEX BUILT SUCCESSFULLY (N = %d)    \n', numRows);
fprintf('===========================================================\n');

end
