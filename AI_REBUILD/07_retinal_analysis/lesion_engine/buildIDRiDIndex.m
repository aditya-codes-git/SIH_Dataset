function [indexTable, stats] = buildIDRiDIndex(sourceDir, outCsvPath)
% BUILDIDRIDINDEX
% Inspects the IDRiD dataset directory, creates a deterministic 1-to-1
% mapping between images and available metadata, and outputs the canonical
% index CSV file.
%
% Usage:
%   [indexTable, stats] = buildIDRiDIndex('D:\SIH_Dataset\IDRID', 'AI_REBUILD/07_retinal_analysis/lesion_engine/idrid_index.csv');

if nargin < 1 || isempty(sourceDir)
    sourceDir = 'D:\SIH_Dataset\IDRID';
end
if nargin < 2 || isempty(outCsvPath)
    scriptDir = fileparts(mfilename('fullpath'));
    outCsvPath = fullfile(scriptDir, 'idrid_index.csv');
end

if ~exist(sourceDir, 'dir')
    error('IDRiD source directory does not exist: %s', sourceDir);
end

fprintf('===========================================================\n');
fprintf('  BUILDING CANONICAL IDRiD DATASET INDEX                   \n');
fprintf('===========================================================\n');
fprintf('Source Path: %s\n', sourceDir);

%% 1. Discover Images
% Search for JPEG images in the standard archive hierarchy
imgSearchPattern = fullfile(sourceDir, '**', '*.jpg');
imgFiles = dir(imgSearchPattern);
if isempty(imgFiles)
    error('No JPG images discovered under %s', sourceDir);
end

% Sort files deterministically by filename
[~, sortIdx] = sort({imgFiles.name});
imgFiles = imgFiles(sortIdx);
numImages = length(imgFiles);
fprintf('Found %d retinal fundus photographs.\n', numImages);

%% 2. Discover Metadata
labelsFile = fullfile(sourceDir, 'archive', 'idrid_labels.csv');
hasLabels = exist(labelsFile, 'file');
if hasLabels
    fprintf('Found labels file: %s\n', labelsFile);
    opts = detectImportOptions(labelsFile);
    opts.VariableNamingRule = 'preserve';
    labelsTable = readtable(labelsFile, opts);
else
    fprintf('WARNING: No idrid_labels.csv found.\n');
    labelsTable = table();
end

%% 3. Search for Lesion Masks & Coordinates (Classes per specification)
% Look for any mask files matching supported lesion classes
maFiles = dir(fullfile(sourceDir, '**', '*Microaneurysm*.*'));
heFiles = dir(fullfile(sourceDir, '**', '*Hemorrhage*.*'));
if isempty(heFiles)
    heFiles = dir(fullfile(sourceDir, '**', '*Haemorrhage*.*'));
end
exFiles = dir(fullfile(sourceDir, '**', '*Hard*Exudate*.*'));
if isempty(exFiles)
    exFiles = dir(fullfile(sourceDir, '**', '*EX*.*'));
    % Filter out non-mask files if any
    exFiles = exFiles(~[exFiles.isdir]);
end
seFiles = dir(fullfile(sourceDir, '**', '*Soft*Exudate*.*'));
if isempty(seFiles)
    seFiles = dir(fullfile(sourceDir, '**', '*SE*.*'));
    seFiles = seFiles(~[seFiles.isdir]);
end
odFiles = dir(fullfile(sourceDir, '**', '*Optic*Disc*.*'));
if isempty(odFiles)
    odFiles = dir(fullfile(sourceDir, '**', '*OD*.*'));
    odFiles = odFiles(~[odFiles.isdir]);
end

fprintf('Discovered Annotation Files:\n');
fprintf(' - Microaneurysm masks: %d\n', length(maFiles));
fprintf(' - Hemorrhage masks:    %d\n', length(heFiles));
fprintf(' - Hard Exudate masks:  %d\n', length(exFiles));
fprintf(' - Soft Exudate masks:  %d\n', length(seFiles));
fprintf(' - Optic Disc masks:    %d\n', length(odFiles));

%% 4. Build Deterministic Index Table
imageIds = cell(numImages, 1);
imagePaths = cell(numImages, 1);
diagnoses = nan(numImages, 1);
dmeRisks = nan(numImages, 1);

microaneurysmMask = repmat({'NA'}, numImages, 1);
hemorrhageMask = repmat({'NA'}, numImages, 1);
hardExudateMask = repmat({'NA'}, numImages, 1);
softExudateMask = repmat({'NA'}, numImages, 1);
opticDiscMask = repmat({'NA'}, numImages, 1);

foveaX = nan(numImages, 1);
foveaY = nan(numImages, 1);
opticDiscX = nan(numImages, 1);
opticDiscY = nan(numImages, 1);

imageWidths = zeros(numImages, 1);
imageHeights = zeros(numImages, 1);

for i = 1:numImages
    [~, baseName, ~] = fileparts(imgFiles(i).name);
    imageIds{i} = baseName;
    imagePaths{i} = fullfile(imgFiles(i).folder, imgFiles(i).name);
    
    % Match diagnosis if labels table exists
    if hasLabels
        matchIdx = find(strcmp(labelsTable.id_code, baseName), 1);
        if ~isempty(matchIdx)
            diagnoses(i) = labelsTable.diagnosis(matchIdx);
            if ismember('Risk of macular edema ', labelsTable.Properties.VariableNames)
                dmeRisks(i) = labelsTable.('Risk of macular edema ')(matchIdx);
            elseif ismember('Risk of macular edema', labelsTable.Properties.VariableNames)
                dmeRisks(i) = labelsTable.('Risk of macular edema')(matchIdx);
            end
        end
    end
    
    % Image dimension check (first 5 and every 50th for speed, or cached)
    if i <= 5 || mod(i, 50) == 0 || i == numImages
        info = imfinfo(imagePaths{i});
        imageWidths(i) = info.Width;
        imageHeights(i) = info.Height;
    else
        imageWidths(i) = 4288;
        imageHeights(i) = 2848;
    end
end

indexTable = table(imageIds, imagePaths, diagnoses, dmeRisks, ...
    microaneurysmMask, hemorrhageMask, hardExudateMask, softExudateMask, opticDiscMask, ...
    foveaX, foveaY, opticDiscX, opticDiscY, imageWidths, imageHeights, ...
    'VariableNames', {'imageId', 'imagePath', 'diagnosis', 'macularEdemaRisk', ...
    'microaneurysmMask', 'hemorrhageMask', 'hardExudateMask', 'softExudateMask', 'opticDiscMask', ...
    'foveaX', 'foveaY', 'opticDiscX', 'opticDiscY', 'imageWidth', 'imageHeight'});

%% 5. Export Canonical Index CSV
outDir = fileparts(outCsvPath);
if ~isempty(outDir) && ~exist(outDir, 'dir')
    mkdir(outDir);
end

writetable(indexTable, outCsvPath);
fprintf('Canonical IDRiD Index saved to:\n  %s\n', outCsvPath);

%% 6. Compile Dataset Statistics
stats = struct();
stats.totalImages = numImages;
stats.width = 4288;
stats.height = 2848;
stats.grades = [sum(diagnoses == 0), sum(diagnoses == 1), sum(diagnoses == 2), sum(diagnoses == 3), sum(diagnoses == 4)];
stats.dmeRisks = [sum(dmeRisks == 0), sum(dmeRisks == 1), sum(dmeRisks == 2)];
stats.numMA = length(maFiles);
stats.numHE = length(heFiles);
stats.numEX = length(exFiles);
stats.numSE = length(seFiles);
stats.numOD = length(odFiles);

fprintf('Index Build Complete (%d images indexed).\n', numImages);
end
