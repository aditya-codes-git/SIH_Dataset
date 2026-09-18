function prepare_preprocessed_dataset()
% PREPARE_PREPROCESSED_DATASET
% Ensures all 3662 APTOS fundus images from train_images/ are processed
% into processed_train_images/ without skipping or silent failures.
%
% Important:
% - Does NOT modify train_images/
% - Does NOT convert image IDs to numeric values
% - Uses actual filenames from dir/imageDatastore
% - Verifies existing files for validity (non-empty & readable)

inputFolder = 'train_images';
outputFolder = 'processed_train_images';

if ~exist(outputFolder, 'dir')
    mkdir(outputFolder);
end

% 1. Discover all input files directly from filesystem
imdsInput = imageDatastore(inputFolder, 'FileExtensions', {'.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff'});
inputFiles = imdsInput.Files;
originalCount = length(inputFiles);

disp(['Original count in train_images/: ', num2str(originalCount)]);

failedFiles = strings(0);

% 2. Process each image with validity check
for i = 1:originalCount
    srcPath = inputFiles{i};
    [~, name, ext] = fileparts(srcPath);
    destPath = fullfile(outputFolder, [name, '.png']);
    
    needProcessing = true;
    
    % Check if destination exists AND is valid (readable image file)
    if exist(destPath, 'file')
        try
            info = dir(destPath);
            if info.bytes > 0
                % Verify image is readable
                imgTest = imread(destPath);
                if ~isempty(imgTest)
                    needProcessing = false;
                end
            end
        catch
            needProcessing = true;
        end
    end
    
    if needProcessing
        try
            img = imread(srcPath);
            imgPre = preprocessFundusKaggle(img, [224 224]);
            imwrite(imgPre, destPath);
        catch err
            warning(['Failed to process image ', name, ': ', err.message]);
            failedFiles(end+1) = string(srcPath);
        end
    end
    
    if mod(i, 500) == 0
        disp(['Checked/Processed ', num2str(i), '/', num2str(originalCount)]);
    end
end

% 3. Verify directory contents
imdsOutput = imageDatastore(outputFolder, 'FileExtensions', {'.png', '.jpg', '.jpeg'});
processedDirCount = length(imdsOutput.Files);
failedCount = length(failedFiles);
successfullyProcessed = originalCount - failedCount;

disp(' ');
disp('===========================================================');
disp('                  DATASET PROCESSING REPORT                ');
disp('===========================================================');
disp(['Original count: ', num2str(originalCount)]);
disp(['Successfully processed: ', num2str(successfullyProcessed)]);
disp(['Failed: ', num2str(failedCount)]);
disp(['Processed directory count: ', num2str(processedDirCount)]);
disp('===========================================================');

if failedCount > 0
    disp('Failed files list:');
    disp(failedFiles');
    error('Dataset processing encountered failures!');
end

end
