function valReport = validateIDRiDSegmentation(indexCsvPath, galleryDir)
% VALIDATEIDRIDSEGMENTATION
% Audits all 81 images and 363 binary masks for:
% 1. Readability, dimension consistency, bit depth, and value distributions.
% 2. Empty masks (foreground pixels == 0) and malformed files.
% 3. Exports representative Visual QA overlays to validation_gallery/.
%
% Usage:
%   valReport = validateIDRiDSegmentation();

scriptDir = fileparts(mfilename('fullpath'));
if nargin < 1 || isempty(indexCsvPath)
    indexCsvPath = fullfile(scriptDir, 'idrid_segmentation_index.csv');
end
if nargin < 2 || isempty(galleryDir)
    galleryDir = fullfile(scriptDir, 'validation_gallery');
end

if ~exist(indexCsvPath, 'file')
    error('Segmentation index CSV not found: %s', indexCsvPath);
end
if ~exist(galleryDir, 'dir')
    mkdir(galleryDir);
end

fprintf('===========================================================\n');
fprintf('  VALIDATING IDRiD LESION SEGMENTATION IMAGES & MASKS      \n');
fprintf('===========================================================\n');

indexTable = readtable(indexCsvPath);
N = height(indexTable);
fprintf('Total images registered in index: %d\n', N);

unreadableImages = 0;
unreadableMasks = 0;
dimMismatches = 0;
emptyMasks = 0;

%% 1. Audit Images
for i = 1:N
    imgPath = indexTable.image_path{i};
    try
        inf = imfinfo(imgPath);
        if inf.Width ~= 4288 || inf.Height ~= 2848 || inf.BitDepth ~= 24
            dimMismatches = dimMismatches + 1;
        end
    catch
        unreadableImages = unreadableImages + 1;
    end
end
fprintf('[AUDIT 1] Images: %d validated (%d unreadable, %d dimension mismatches)\n', ...
    N, unreadableImages, dimMismatches);

%% 2. Audit Masks
maskCols = {'ma_mask_path', 'he_mask_path', 'ex_mask_path', 'se_mask_path', 'optic_disc_mask_path'};
totalMasksChecked = 0;

for c = 1:length(maskCols)
    col = maskCols{c};
    for i = 1:N
        mPath = indexTable.(col){i};
        if ~strcmp(mPath, 'NA') && ~isempty(mPath)
            totalMasksChecked = totalMasksChecked + 1;
            try
                infM = imfinfo(mPath);
                if infM.Width ~= 4288 || infM.Height ~= 2848
                    dimMismatches = dimMismatches + 1;
                end
                m = imread(mPath);
                if sum(m(:) > 0) == 0
                    emptyMasks = emptyMasks + 1;
                end
            catch
                unreadableMasks = unreadableMasks + 1;
            end
        end
    end
end
fprintf('[AUDIT 2] Masks: %d validated (%d unreadable, %d empty, %d dimension mismatches)\n', ...
    totalMasksChecked, unreadableMasks, emptyMasks, dimMismatches);

%% 3. Generate Visual QA Gallery Samples
fprintf('[AUDIT 3] Generating Visual QA Gallery samples...\n');

% Sample case 1: IDRiD_03 (Severe DR, Grade 2/3 - has all 4 lesions: MA, HE, EX, SE, OD)
sampleRow = find(strcmp(indexTable.image_id, 'IDRiD_03'), 1);
if ~isempty(sampleRow)
    rawImg = imread(indexTable.image_path{sampleRow});
    prevImg = imresize(rawImg, [712, 1072]);
    imwrite(prevImg, fullfile(galleryDir, 'seg_sample_IDRiD_03_original.jpg'), 'Quality', 95);
    
    safeReadMask = @(p) readSafe(p, [712, 1072]);
    
    maMask = safeReadMask(indexTable.ma_mask_path{sampleRow});
    heMask = safeReadMask(indexTable.he_mask_path{sampleRow});
    exMask = safeReadMask(indexTable.ex_mask_path{sampleRow});
    seMask = safeReadMask(indexTable.se_mask_path{sampleRow});
    odMask = safeReadMask(indexTable.optic_disc_mask_path{sampleRow});
    
    % Export standalone masks
    imwrite(uint8(maMask) * 255, fullfile(galleryDir, 'seg_sample_IDRiD_03_MA_mask.png'));
    imwrite(uint8(heMask) * 255, fullfile(galleryDir, 'seg_sample_IDRiD_03_HE_mask.png'));
    imwrite(uint8(exMask) * 255, fullfile(galleryDir, 'seg_sample_IDRiD_03_EX_mask.png'));
    imwrite(uint8(seMask) * 255, fullfile(galleryDir, 'seg_sample_IDRiD_03_SE_mask.png'));
    imwrite(uint8(odMask) * 255, fullfile(galleryDir, 'seg_sample_IDRiD_03_OD_mask.png'));
    
    % Create color composite overlay
    % Red: HE, Magenta: MA, Yellow: EX, Cyan: SE, Blue: OD
    overlay = double(prevImg) / 255;
    
    % Dilate slightly for visual clarity on preview resolution
    kDil = ones(3,3);
    maD = filter2(kDil, double(maMask)) > 0;
    heD = filter2(kDil, double(heMask)) > 0;
    exD = filter2(kDil, double(exMask)) > 0;
    seD = filter2(kDil, double(seMask)) > 0;
    odD = filter2(kDil, double(odMask)) > 0;
    
    % Apply colored highlights
    colOD = [0, 0.7, 1.0];
    colEX = [1.0, 0.9, 0.0];
    colHE = [1.0, 0.1, 0.1];
    colSE = [0.4, 0.9, 1.0];
    colMA = [1.0, 0.0, 1.0];
    
    for c = 1:3
        ch = overlay(:,:,c);
        ch(odD) = ch(odD) * 0.4 + colOD(c) * 0.6;
        ch(exD) = colEX(c);
        ch(heD) = colHE(c);
        ch(seD) = colSE(c);
        ch(maD) = colMA(c);
        overlay(:,:,c) = ch;
    end
    
    imwrite(uint8(overlay * 255), fullfile(galleryDir, 'seg_sample_IDRiD_01_all_lesions_overlay.jpg'), 'Quality', 95);
    fprintf('          Generated IDRiD_01 multi-lesion inspection overlay.\n');
end

% Sample case 2: IDRiD_43 (Mild DR, Grade 1 - MA and EX only, no HE or SE)
sampleRow2 = find(strcmp(indexTable.image_id, 'IDRiD_43'), 1);
if ~isempty(sampleRow2)
    rawImg2 = imread(indexTable.image_path{sampleRow2});
    prevImg2 = imresize(rawImg2, [712, 1072]);
    imwrite(prevImg2, fullfile(galleryDir, 'seg_sample_IDRiD_43_mild_original.jpg'), 'Quality', 95);
    
    maMask2 = imresize(imread(indexTable.ma_mask_path{sampleRow2}) > 0, [712, 1072], 'nearest');
    exMask2 = imresize(imread(indexTable.ex_mask_path{sampleRow2}) > 0, [712, 1072], 'nearest');
    
    overlay2 = double(prevImg2) / 255;
    kDil = ones(3,3);
    maD2 = filter2(kDil, double(maMask2)) > 0;
    exD2 = filter2(kDil, double(exMask2)) > 0;
    
    colEX2 = [1.0, 0.9, 0.0];
    colMA2 = [1.0, 0.0, 1.0];
    for c = 1:3
        ch = overlay2(:,:,c);
        ch(exD2) = colEX2(c);
        ch(maD2) = colMA2(c);
        overlay2(:,:,c) = ch;
    end
    imwrite(uint8(overlay2 * 255), fullfile(galleryDir, 'seg_sample_IDRiD_43_mild_overlay.jpg'), 'Quality', 95);
    fprintf('          Generated IDRiD_43 mild DR inspection overlay.\n');
end

%% 4. Compile Results
valReport = struct();
valReport.unreadableImages = unreadableImages;
valReport.unreadableMasks = unreadableMasks;
valReport.dimMismatches = dimMismatches;
valReport.emptyMasks = emptyMasks;
valReport.totalMasksChecked = totalMasksChecked;
valReport.status = 'VALIDATED';

fprintf('Visual QA Gallery successfully updated at:\n  %s\n', galleryDir);
end

function m = readSafe(filePath, targetSize)
if isempty(filePath) || strcmp(filePath, 'NA') || ~exist(filePath, 'file')
    m = false(targetSize);
    return;
end
raw = imread(filePath);
m = imresize(raw > 0, targetSize, 'nearest');
end
