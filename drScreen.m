function result = drScreen(img)

% ============================================================
% END-TO-END DR SCREENING PIPELINE (PREPROCESSED MODEL)
%
% Fundus Image
%      ↓
% Image Quality Assessment (IQA Hard Gate)
%      ↓
% If UNGRADABLE -> Stop & Return Recapture Message
%      ↓
% Kaggle Preprocessing (preprocessFundusKaggle)
%      ↓
% DR Classification (ResNet-18)
%      ↓
% Confidence + Referral Decision
%      ↓
% Grad-CAM Explainability
% ============================================================

%% Load trained model (trained_dr_model_preprocessed.mat)
modelFile = 'trained_dr_model_preprocessed.mat';
if ~exist(modelFile, 'file')
    modelFile = 'trained_dr_model.mat';
end
load(modelFile, 'trainedNet');

%% STEP 1: IMAGE QUALITY ASSESSMENT
[gradable, reason, focusScore, brightness, fovRatio] = ...
    imageQualityCheck(img);

% Store quality information
result.quality.gradable = gradable;
result.quality.reason = reason;
result.quality.focusScore = focusScore;
result.quality.brightness = brightness;
result.quality.fovRatio = fovRatio;

%% STOP IF IMAGE IS UNGRADABLE
if ~gradable
    result.status = "UNGRADABLE";
    result.message = "Please recapture the retinal image.";
    return;
end

%% STEP 2: PREPROCESSING (Kaggle-style crop + Ben Graham enhancement)
inputSize = trainedNet.Layers(1).InputSize;

imgPreprocessed = preprocessFundusKaggle(img, inputSize(1:2));

if size(imgPreprocessed, 3) == 1
    imgPreprocessed = repmat(imgPreprocessed, 1, 1, 3);
end

%% STEP 3: DR CLASSIFICATION
[predictedClass,scores] = classify(trainedNet,imgPreprocessed);

confidence = max(scores);
grade = str2double(string(predictedClass));

%% STEP 4: REFERRAL DECISION
referable = grade >= 2;

if referable
    referral = "REFERABLE DR";
else
    referral = "NON-REFERABLE DR";
end

%% STEP 5: GRAD-CAM EXPLAINABILITY
scoreMap = gradCAM(trainedNet,imgPreprocessed,predictedClass);

%% FINAL RESULT
result.status = "GRADABLE";
result.grade = grade;
result.predictedClass = predictedClass;
result.confidence = confidence;
result.referable = referable;
result.referral = referral;
result.scoreMap = scoreMap;
result.processedImage = double(imgPreprocessed)/255;

end