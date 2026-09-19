function compare_models()
% COMPARE_MODELS
% Performs a fair head-to-head evaluation comparing:
% 1. Baseline Model (trained_dr_model.mat)
% 2. Preprocessed Model (trained_dr_model_preprocessed.mat)
% using the identical 20% validation split (rng(42)).

rng(42); % Fixed seed for exact reproducible evaluation split

% 1. Read train.csv and build image datastore
data = readtable('train.csv', 'TextType', 'string');

% Raw images for baseline model evaluation
imdsRaw = imageDatastore('train_images', 'FileExtensions', {'.png', '.jpg', '.jpeg'});
[~, rawNames, ~] = fileparts(imdsRaw.Files);
[foundRaw, locRaw] = ismember(string(rawNames), data.id_code);
imdsRawClean = imageDatastore(imdsRaw.Files(foundRaw));
imdsRawClean.Labels = categorical(data.diagnosis(locRaw(foundRaw)));

% Split baseline datastore 80/20
[trainImdsRaw, valImdsRaw] = splitEachLabel(imdsRawClean, 0.8, 'randomized');

% Preprocessed images for preprocessed model evaluation
imdsPre = imageDatastore('processed_train_images', 'FileExtensions', {'.png', '.jpg', '.jpeg'});
[~, preNames, ~] = fileparts(imdsPre.Files);
[foundPre, locPre] = ismember(string(preNames), data.id_code);
imdsPreClean = imageDatastore(imdsPre.Files(foundPre));
imdsPreClean.Labels = categorical(data.diagnosis(locPre(foundPre)));

% Split preprocessed datastore 80/20 with identical seed
rng(42);
[trainImdsPre, valImdsPre] = splitEachLabel(imdsPreClean, 0.8, 'randomized');

numVal = length(valImdsRaw.Files);
disp(['Total validation samples evaluated: ', num2str(numVal)]);

%% 2. EVALUATE BASELINE MODEL (trained_dr_model.mat)
disp('Evaluating Baseline Model (trained_dr_model.mat)...');
load('trained_dr_model.mat', 'trainedNet');
baseNet = trainedNet;

basePreds = categorical(zeros(numVal, 1), 0:4);
baseScoresAll = zeros(numVal, 5);

for i = 1:numVal
    img = imread(valImdsRaw.Files{i});
    imgProc = imresize(img, [224 224]);
    imgProc = double(imgProc) / 255;
    if size(imgProc, 3) == 1
        imgProc = repmat(imgProc, 1, 1, 3);
    end
    [p, scores] = classify(baseNet, imgProc);
    basePreds(i) = p;
    baseScoresAll(i, :) = scores;
end

%% 3. EVALUATE PREPROCESSED MODEL (trained_dr_model_preprocessed.mat)
disp('Evaluating Preprocessed Model (trained_dr_model_preprocessed.mat)...');
load('trained_dr_model_preprocessed.mat', 'trainedNet');
preNet = trainedNet;

[prePreds, preScoresAll] = classify(preNet, valImdsPre);

%% 4. COMPUTE METRICS FOR BOTH MODELS
trueNum = str2double(string(valImdsRaw.Labels));
baseNum = str2double(string(basePreds));
preNum = str2double(string(prePreds));

% A) BASELINE METRICS
mBase = compute_all_metrics(trueNum, baseNum);

% B) PREPROCESSED MODEL METRICS
mPre = compute_all_metrics(trueNum, preNum);

%% 5. PRINT COMPARISON REPORT
disp('===========================================================');
disp('            HEAD-TO-HEAD MODEL EVALUATION REPORT           ');
disp('===========================================================');
fprintf('%-30s | %-15s | %-15s\n', 'Metric', 'Baseline Model', 'Preprocessed Model');
fprintf('%-30s | %-15s | %-15s\n', '------------------------------', '---------------', '---------------');
fprintf('%-30s | %-15.2f | %-15.2f\n', 'Overall Accuracy (%)', mBase.acc * 100, mPre.acc * 100);
fprintf('%-30s | %-15.2f | %-15.2f\n', 'Grade 2-4 Sensitivity (%)', mBase.sensitivity * 100, mPre.sensitivity * 100);
fprintf('%-30s | %-15.2f | %-15.2f\n', 'Grade 2-4 Specificity (%)', mBase.specificity * 100, mPre.specificity * 100);
fprintf('%-30s | %-15.4f | %-15.4f\n', 'Macro F1 Score', mBase.macroF1, mPre.macroF1);
disp('-----------------------------------------------------------');

disp('BASELINE MODEL CONFUSION MATRIX (Rows=True 0-4, Cols=Pred 0-4):');
disp(mBase.cm);
disp('Baseline Per-Class Precision [0..4]:'); disp(mBase.precision');
disp('Baseline Per-Class Recall [0..4]:'); disp(mBase.recall');

disp('-----------------------------------------------------------');
disp('PREPROCESSED MODEL CONFUSION MATRIX (Rows=True 0-4, Cols=Pred 0-4):');
disp(mPre.cm);
disp('Preprocessed Per-Class Precision [0..4]:'); disp(mPre.precision');
disp('Preprocessed Per-Class Recall [0..4]:'); disp(mPre.recall');
disp('===========================================================');

%% 6. EVALUATE PROBLEMATIC GRADE-2 APTOS CASE
disp(' ');
disp('===========================================================');
disp('      PROBLEMATIC GRADE-2 APTOS IMAGE EVALUATION           ');
disp('===========================================================');

grade2Rows = data(data.diagnosis == 2, :);
sampleCase = grade2Rows(1, :);
idCode = char(sampleCase.id_code);

imgFile = fullfile('train_images', [idCode, '.png']);
if ~exist(imgFile, 'file')
    imgFile = fullfile('train_images', [idCode, '.jpg']);
end

rawImg = imread(imgFile);

% Baseline prediction
bImg = imresize(rawImg, [224 224]);
bImg = double(bImg) / 255;
if size(bImg, 3) == 1; bImg = repmat(bImg, 1, 1, 3); end
[bPred, bScores] = classify(baseNet, bImg);

% Preprocessed prediction
pImg = preprocessFundusKaggle(rawImg, [224 224]);
[pPred, pScores] = classify(preNet, pImg);

disp(['APTOS Image ID: ', idCode]);
disp(['Ground Truth Diagnosis:              Grade 2 (Moderate DR)']);
disp(['Baseline Prediction:                Grade ', char(bPred), ' (Confidence: ', num2str(max(bScores)*100, '%.2f'), '%)']);
disp(['Baseline 5-Class Probabilities:     [0: ', num2str(bScores(1),'%.4f'), ', 1: ', num2str(bScores(2),'%.4f'), ', 2: ', num2str(bScores(3),'%.4f'), ', 3: ', num2str(bScores(4),'%.4f'), ', 4: ', num2str(bScores(5),'%.4f'), ']']);
disp(['Preprocessed Model Prediction:      Grade ', char(pPred), ' (Confidence: ', num2str(max(pScores)*100, '%.2f'), '%)']);
disp(['Preprocessed 5-Class Probabilities: [0: ', num2str(pScores(1),'%.4f'), ', 1: ', num2str(pScores(2),'%.4f'), ', 2: ', num2str(pScores(3),'%.4f'), ', 3: ', num2str(pScores(4),'%.4f'), ', 4: ', num2str(pScores(5),'%.4f'), ']']);
disp('===========================================================');

save('model_comparison_results.mat', 'mBase', 'mPre');

end

function m = compute_all_metrics(trueNum, predNum)
cm = confusionmat(trueNum, predNum);
acc = sum(diag(cm)) / sum(cm(:));

% Grade >= 2 Referable DR
trueRef = trueNum >= 2;
predRef = predNum >= 2;
refCM = confusionmat(trueRef, predRef);

TN = refCM(1,1); FP = refCM(1,2);
FN = refCM(2,1); TP = refCM(2,2);

sensitivity = TP / max(1, (TP + FN));
specificity = TN / max(1, (TN + FP));

numClasses = 5;
precision = zeros(numClasses, 1);
recall = zeros(numClasses, 1);
f1 = zeros(numClasses, 1);

for c = 1:numClasses
    tp_c = cm(c, c);
    fp_c = sum(cm(:, c)) - tp_c;
    fn_c = sum(cm(c, :)) - tp_c;
    
    precision(c) = tp_c / max(1, (tp_c + fp_c));
    recall(c) = tp_c / max(1, (tp_c + fn_c));
    
    if (precision(c) + recall(c)) > 0
        f1(c) = 2 * (precision(c) * recall(c)) / (precision(c) + recall(c));
    else
        f1(c) = 0;
    end
end

macroF1 = mean(f1);

m.cm = cm;
m.acc = acc;
m.sensitivity = sensitivity;
m.specificity = specificity;
m.precision = precision;
m.recall = recall;
m.f1 = f1;
m.macroF1 = macroF1;
end
