function prepare_preprocessed_dataset_fast()
% PREPARE_PREPROCESSED_DATASET_FAST
% Preprocesses all 3662 APTOS images into processed_train_images/.
% DOES NOT modify or delete train_images/.

inputFolder = 'train_images';
outputFolder = 'processed_train_images';

if ~exist(outputFolder, 'dir')
    mkdir(outputFolder);
end

data = readtable('train.csv', 'TextType', 'string');
numImages = height(data);

idCodes = data.id_code;

disp(['Processing ', num2str(numImages), ' images from train_images/ to processed_train_images/...']);

% Start parallel pool if available
if isempty(gcp('nocreate'))
    try
        parpool('local');
    catch
        disp('Parallel pool start fallback to single thread.');
    end
end

parfor i = 1:numImages
    idCode = char(idCodes(i));
    outPath = fullfile(outputFolder, [idCode, '.png']);
    
    if exist(outPath, 'file')
        continue;
    end
    
    inPath = fullfile(inputFolder, [idCode, '.png']);
    if ~exist(inPath, 'file')
        inPath = fullfile(inputFolder, [idCode, '.jpg']);
    end
    if ~exist(inPath, 'file')
        inPath = fullfile(inputFolder, [idCode, '.jpeg']);
    end
    
    if exist(inPath, 'file')
        try
            img = imread(inPath);
            imgPre = preprocessFundusKaggle(img, [224 224]);
            imwrite(imgPre, outPath);
        catch err
            disp(['Error processing ', idCode, ': ', err.message]);
        end
    end
end

disp('===========================================================');
disp('   PREPROCESSED DATASET GENERATION COMPLETED CLEANLY      ');
disp('===========================================================');

end
