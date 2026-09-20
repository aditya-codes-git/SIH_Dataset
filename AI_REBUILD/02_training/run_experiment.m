function [trainedNet, valMetrics] = run_experiment(expType)
% RUN_EXPERIMENT
% Executes one experiment from the Phase 2 matrix using the canonical split.
%
% Supported expType:
%   'R18-V2-BASELINE'     - ResNet-18, no augmentation, standard cross-entropy
%   'R18-AUG'             - ResNet-18, fundus augmentation, standard cross-entropy
%   'R18-WEIGHTED'        - ResNet-18, no augmentation, weighted cross-entropy
%   'R18-AUG-WEIGHTED'    - ResNet-18, fundus augmentation, weighted cross-entropy
%   'R18-FINAL-CANDIDATE' - ResNet-18, augmentation, weighted loss, tuned LR schedule

baseDir = fileparts(mfilename('fullpath'));
addpath(baseDir);
addpath(fullfile(baseDir, '..', '03_evaluation'));

% 1. Fixed random seed for exact reproducibility
rng(42);

fprintf('\n===========================================================\n');
fprintf('  STARTING EXPERIMENT: %s\n', expType);
fprintf('===========================================================\n');

% 2. Load canonical splits
[trainImds, trainIds, trainLabels] = loadCanonicalDataset('TRAIN', true);
[calImds, calIds, calLabels]       = loadCanonicalDataset('CALIBRATION', true);

inputSize = [224 224 3];

% 3. Determine experiment configuration
useAug = false;
useWeighted = false;
maxEpochs = 6;
initialLR = 1e-4;
lrSchedule = 'none';

switch upper(expType)
    case 'R18-V2-BASELINE'
        useAug = false;
        useWeighted = false;
        maxEpochs = 6;
    case 'R18-AUG'
        useAug = true;
        useWeighted = false;
        maxEpochs = 6;
    case 'R18-WEIGHTED'
        useAug = false;
        useWeighted = true;
        maxEpochs = 6;
    case 'R18-AUG-WEIGHTED'
        useAug = true;
        useWeighted = true;
        maxEpochs = 6;
    case 'R18-FINAL-CANDIDATE'
        useAug = true;
        useWeighted = true;
        maxEpochs = 8;
        lrSchedule = 'piecewise';
    otherwise
        error('Unknown experiment type: %s', expType);
end

% 4. Prepare training datastore (with or without augmentation)
if useAug
    trainSource = createAugmentationPipeline(trainImds, inputSize);
else
    trainSource = augmentedImageDatastore(inputSize(1:2), trainImds, ...
        'ColorPreprocessing', 'gray2rgb');
end

% Calibration datastore (never augmented)
calSource = augmentedImageDatastore(inputSize(1:2), calImds, ...
    'ColorPreprocessing', 'gray2rgb');

% 5. Build network architecture (ResNet-18)
baseNet = resnet18;
lgraph = layerGraph(baseNet);

numClasses = 5;
newFc = fullyConnectedLayer(numClasses, 'Name', 'new_fc', ...
    'WeightLearnRateFactor', 10, 'BiasLearnRateFactor', 10);
lgraph = replaceLayer(lgraph, 'fc1000', newFc);

if useWeighted
    [classWeights, weightsTable] = createWeightedLoss(trainLabels, 'moderated');
    newClassLayer = classificationLayer('Name', 'new_classoutput', ...
        'Classes', categorical(0:4), 'ClassWeights', classWeights);
else
    classWeights = ones(numClasses, 1);
    newClassLayer = classificationLayer('Name', 'new_classoutput', ...
        'Classes', categorical(0:4));
end

lgraph = replaceLayer(lgraph, 'ClassificationLayer_predictions', newClassLayer);

% 6. Configure training options
checkpointDir = fullfile(baseDir, 'checkpoints', lower(strrep(expType, '-', '_')));
if ~exist(checkpointDir, 'dir')
    mkdir(checkpointDir);
end

if strcmp(lrSchedule, 'piecewise')
    trainOpts = trainingOptions('adam', ...
        'MiniBatchSize', 32, ...
        'MaxEpochs', maxEpochs, ...
        'InitialLearnRate', initialLR, ...
        'LearnRateSchedule', 'piecewise', ...
        'LearnRateDropPeriod', 4, ...
        'LearnRateDropFactor', 0.5, ...
        'Shuffle', 'every-epoch', ...
        'ValidationData', calSource, ...
        'ValidationFrequency', 20, ...
        'Verbose', true, ...
        'Plots', 'none');
else
    trainOpts = trainingOptions('adam', ...
        'MiniBatchSize', 32, ...
        'MaxEpochs', maxEpochs, ...
        'InitialLearnRate', initialLR, ...
        'Shuffle', 'every-epoch', ...
        'ValidationData', calSource, ...
        'ValidationFrequency', 20, ...
        'Verbose', true, ...
        'Plots', 'none');
end

% 7. Train network
fprintf('Training network for %d epochs on GPU/CPU...\n', maxEpochs);
trainedNet = trainNetwork(trainSource, lgraph, trainOpts);

% 8. Evaluate on CALIBRATION set
valMetrics = evaluateModelOnDataset(trainedNet, calImds, [expType, ' (CALIBRATION)']);

% 9. Save model and metadata
modelFileName = sprintf('trained_dr_model_%s.mat', lower(strrep(expType, '-', '_')));
modelFilePath = fullfile(baseDir, 'models', modelFileName);
save(modelFilePath, 'trainedNet', 'valMetrics', 'classWeights');
fprintf('Saved model weights to: %s\n', modelFilePath);

% Save metadata struct / MAT
metaFileName = sprintf('meta_%s.mat', lower(strrep(expType, '-', '_')));
save(fullfile(baseDir, 'model_configs', metaFileName), 'valMetrics', 'trainOpts');

end
