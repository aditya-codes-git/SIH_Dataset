function evaluate_grade2_case()
% EVALUATE_GRADE2_CASE
% Evaluates Grade 2 APTOS images on both:
% A) Baseline model (trained_dr_model.mat) + simple resize
% B) Improved preprocessed model (trained_dr_model_preprocessed.mat) + Kaggle preprocessing

data = readtable('train.csv', 'TextType', 'string');

% Find Grade 2 images
grade2Rows = data(data.diagnosis == 2, :);
disp(['Found ', num2str(height(grade2Rows)), ' Grade 2 images in train.csv']);

% Load both models
load('trained_dr_model.mat', 'trainedNet');
baseNet = trainedNet;

load('trained_dr_model_preprocessed.mat', 'trainedNet');
preNet = trainedNet;

% Evaluate on sample Grade 2 images (e.g., first 5 Grade 2 images)
disp('===========================================================');
disp('   COMPARING BASELINE VS PREPROCESSED MODEL ON GRADE 2 CASES');
disp('===========================================================');

for i = 1:min(5, height(grade2Rows))
    idCode = char(grade2Rows.id_code(i));
    imgFile = fullfile('train_images', [idCode, '.png']);
    if ~exist(imgFile, 'file')
        imgFile = fullfile('train_images', [idCode, '.jpg']);
    end
    
    if exist(imgFile, 'file')
        rawImg = imread(imgFile);
        
        % A) Baseline preprocessing
        baseImg = imresize(rawImg, [224 224]);
        baseImg = double(baseImg) / 255;
        if size(baseImg, 3) == 1
            baseImg = repmat(baseImg, 1, 1, 3);
        end
        [basePred, baseScores] = classify(baseNet, baseImg);
        
        % B) Kaggle-style preprocessing
        preImg = preprocessFundusKaggle(rawImg, [224 224]);
        [prePred, preScores] = classify(preNet, preImg);
        
        disp(['Image ID: ', idCode]);
        disp(['  Ground Truth Diagnosis: 2 (Moderate DR)']);
        disp(['  A) Baseline Model Prediction:   Grade ', char(basePred), ' (Confidence: ', num2str(max(baseScores)*100, '%.2f'), '%)']);
        disp(['     Baseline Class Probabilities [0..4]: [', num2str(baseScores, '%.4f '), ']']);
        disp(['  B) Preprocessed Model Prediction: Grade ', char(prePred), ' (Confidence: ', num2str(max(preScores)*100, '%.2f'), '%)']);
        disp(['     Preprocessed Probabilities [0..4]: [', num2str(preScores, '%.4f '), ']']);
        disp('-----------------------------------------------------------');
    end
end

end
