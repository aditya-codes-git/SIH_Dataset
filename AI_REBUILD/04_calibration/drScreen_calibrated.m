function result = drScreen_calibrated(img, varargin)
% DRSCREEN_CALIBRATED
% Experimental backward-compatible screening wrapper with post-hoc probability
% calibration and continuous referable-risk estimation.
%
% Preserves 100% of legacy fields from drScreen.m while adding additive
% calibration and probability metadata.
%
% Usage:
%   result = drScreen_calibrated(img)
%   result = drScreen_calibrated(imgPath)

p = inputParser;
addRequired(p, 'img');
addParameter(p, 'ModelFile', fullfile(fileparts(fileparts(mfilename('fullpath'))), '02_training', 'models', 'trained_dr_model_r18_final_candidate.mat'), @ischar);
addParameter(p, 'CalibrationFile', fullfile(fileparts(mfilename('fullpath')), 'calibration_parameters.mat'), @ischar);
parse(p, img, varargin{:});

% Load image if string/char path
if ischar(img) || isstring(img)
    img = imread(char(img));
end

%% STEP 1: IMAGE QUALITY ASSESSMENT (Hard Gate)
[gradable, reason, focusScore, brightness, fovRatio] = imageQualityCheck(img);

result = struct();
result.quality.gradable = gradable;
result.quality.reason = reason;
result.quality.focusScore = focusScore;
result.quality.brightness = brightness;
result.quality.fovRatio = fovRatio;

if ~gradable
    result.status = "UNGRADABLE";
    result.message = "Please recapture the retinal image.";
    result.grade = NaN;
    result.predictedClass = categorical(NaN);
    result.confidence = 0;
    result.referable = false;
    result.referral = "UNGRADABLE";
    result.scoreMap = [];
    result.processedImage = [];
    result.probabilities = [];
    result.rawConfidence = 0;
    result.calibratedProbabilities = [];
    result.calibratedConfidence = 0;
    result.referableRiskProbability = 0;
    result.calibration.calibrated = false;
    return;
end

%% STEP 2: LOAD FROZEN MODEL AND CALIBRATION PARAMETERS
modelData = load(p.Results.ModelFile);
trainedNet = modelData.trainedNet;

T = 1.0;
if exist(p.Results.CalibrationFile, 'file')
    calibData = load(p.Results.CalibrationFile);
    T = calibData.calibration.temperature;
end

%% STEP 3: PREPROCESSING
inputSize = trainedNet.Layers(1).InputSize;
imgPreprocessed = preprocessFundusKaggle(img, inputSize(1:2));
if size(imgPreprocessed, 3) == 1
    imgPreprocessed = repmat(imgPreprocessed, 1, 1, 3);
end

%% STEP 4: EXTRACTION & TEMPERATURE SCALING
rawLogits = activations(trainedNet, imgPreprocessed, 'new_fc');
logits = double(reshape(squeeze(rawLogits), 1, 5));

% Raw Softmax
expRaw = exp(logits - max(logits));
rawProbs = expRaw / sum(expRaw);
rawConf = max(rawProbs);

% Calibrated Softmax (Temperature Scaling)
scaledLogits = logits / T;
expCalib = exp(scaledLogits - max(scaledLogits));
calibProbs = expCalib / sum(expCalib);
calibConf = max(calibProbs);

[~, predIdx] = max(calibProbs);
grade = predIdx - 1; % 0..4
predictedClass = categorical(grade, 0:4);

%% STEP 5: REFERABLE RISK & LEGACY REFERRAL DECISION
% Production rule preserved: grade >= 2
referable = grade >= 2;
if referable
    referral = "REFERABLE DR";
else
    referral = "NON-REFERABLE DR";
end

% Continuous Referable Risk Formulation: P(Grade 2) + P(Grade 3) + P(Grade 4)
pRef = sum(calibProbs(3:5));
pNonRef = sum(calibProbs(1:2));

%% STEP 6: GRAD-CAM
scoreMap = gradCAM(trainedNet, imgPreprocessed, predictedClass);

%% STEP 7: ASSEMBLE BACKWARD-COMPATIBLE RESULT
classLabels = {'No DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Proliferative DR'};

% 1. Legacy Fields (100% Preserved for Existing Callers)
result.status = "GRADABLE";
result.grade = grade;
result.predictedClass = predictedClass;
result.confidence = rawConf; % Legacy confidence field
result.referable = referable;
result.referral = referral;
result.scoreMap = scoreMap;
result.processedImage = double(imgPreprocessed) / 255;

% 2. Additive Probability & Calibration Fields
result.probabilities = rawProbs;
result.rawConfidence = rawConf;
result.calibratedProbabilities = calibProbs;
result.calibratedConfidence = calibConf;
result.referableRiskProbability = pRef;
result.nonReferableRiskProbability = pNonRef;

result.classification = struct(...
    'grade', grade, ...
    'label', classLabels{grade + 1}, ...
    'probabilities', calibProbs, ...
    'rawConfidence', rawConf, ...
    'calibratedConfidence', calibConf, ...
    'calibrated', true, ...
    'calibrationMethod', 'Temperature Scaling', ...
    'temperature', T, ...
    'modelVersion', '2.0.0-final-candidate');

result.calibration = struct(...
    'calibrated', true, ...
    'temperature', T, ...
    'method', 'Temperature Scaling');

end
