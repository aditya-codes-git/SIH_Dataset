function trainingResults = trainLesionModels(patchesMatPath, outDir, trainOpts)
% TRAINLESIONMODELS
% Trains a multi-head U-Net for pixel-level diabetic retinopathy lesion
% segmentation (MA, HE, EX, SE) using pure MATLAB Deep Learning Toolbox.
%
% Features:
%   - Architecture: Custom 3-level U-Net with skip connections
%   - Loss: Combined Soft Dice Loss + Binary Cross-Entropy Loss
%   - Hardware: GPU acceleration via dlnetwork and dlgradient
%   - Validation: Per-class Dice tracking and best checkpoint preservation
%
% Usage:
%   trainingResults = trainLesionModels();

scriptDir = fileparts(mfilename('fullpath'));
if nargin < 1 || isempty(patchesMatPath)
    patchesMatPath = fullfile(scriptDir, 'configs', 'lesion_patches.mat');
end
if nargin < 2 || isempty(outDir)
    outDir = scriptDir;
end
if nargin < 3 || isempty(trainOpts)
    trainOpts = struct();
end

if ~isfield(trainOpts, 'numEpochs'), trainOpts.numEpochs = 25; end
if ~isfield(trainOpts, 'batchSize'), trainOpts.batchSize = 16; end
if ~isfield(trainOpts, 'initialLR'), trainOpts.initialLR = 1e-3; end
if ~isfield(trainOpts, 'lrDecayFactor'), trainOpts.lrDecayFactor = 0.5; end
if ~isfield(trainOpts, 'lrDecayStep'), trainOpts.lrDecayStep = 8; end

addpath(fullfile(scriptDir, 'models'));
addpath(fullfile(scriptDir, 'augmentation'));

fprintf('===========================================================\n');
fprintf('  STARTING IDRiD LESION SEGMENTATION MODEL TRAINING (U-NET)\n');
fprintf('===========================================================\n');

if ~exist(patchesMatPath, 'file')
    error('Lesion patches MAT file missing: %s', patchesMatPath);
end

data = load(patchesMatPath);
trainX = data.trainData.X;
trainY = data.trainData.Y;
valX = data.valData.X;
valY = data.valData.Y;
valHasSE = data.valData.hasSE;

numTrain = size(trainX, 4);
numVal = size(valX, 4);
fprintf('Loaded Patches: %d Train, %d Validation\n', numTrain, numVal);

%% 1. Initialize U-Net dlnetwork
net = buildLesionUnet([256, 256, 3], 4);
totalParams = sum(cellfun(@numel, net.Learnables.Value));
fprintf('Model Architecture: U-Net (3-level encoder/decoder with skip connections)\n');
fprintf('Total Learnable Parameters: %d\n', totalParams);

%% 2. Setup Adam Optimizer States
trailingAvg = [];
trailingAvgSq = [];
iteration = 0;
learningRate = trainOpts.initialLR;
batchSize = trainOpts.batchSize;
numBatches = floor(numTrain / batchSize);

history = struct();
history.trainLoss = zeros(trainOpts.numEpochs, 1);
history.valLoss = zeros(trainOpts.numEpochs, 1);
history.valDiceMA = zeros(trainOpts.numEpochs, 1);
history.valDiceHE = zeros(trainOpts.numEpochs, 1);
history.valDiceEX = zeros(trainOpts.numEpochs, 1);
history.valDiceSE = zeros(trainOpts.numEpochs, 1);
history.valMeanDice = zeros(trainOpts.numEpochs, 1);

bestValDice = -1;
bestEpoch = 0;
bestNet = net;

modelsDir = fullfile(outDir, 'models');
historiesDir = fullfile(outDir, 'histories');
configsDir = fullfile(outDir, 'configs');
if ~exist(modelsDir, 'dir'), mkdir(modelsDir); end
if ~exist(historiesDir, 'dir'), mkdir(historiesDir); end
if ~exist(configsDir, 'dir'), mkdir(configsDir); end

tTrainStart = tic;

%% 3. Training Loop
for epoch = 1:trainOpts.numEpochs
    tEpoch = tic;
    
    % Learning rate schedule
    if epoch > 1 && mod(epoch, trainOpts.lrDecayStep) == 0
        learningRate = learningRate * trainOpts.lrDecayFactor;
        fprintf('  [Epoch %d] Learning rate updated to: %.2e\n', epoch, learningRate);
    end
    
    % Shuffle training data
    perm = randperm(numTrain);
    epochLoss = 0;
    
    for b = 1:numBatches
        iteration = iteration + 1;
        batchIdx = perm((b-1)*batchSize + 1 : b*batchSize);
        
        % Data augmentation
        batchX = trainX(:, :, :, batchIdx);
        batchY = trainY(:, :, :, batchIdx);
        [batchX_aug, batchY_aug] = augmentLesionPatches(batchX, batchY);
        
        % Convert to dlarray on GPU
        dlX = dlarray(gpuArray(single(batchX_aug)), 'SSCB');
        dlY = dlarray(gpuArray(single(batchY_aug)), 'SSCB');
        
        % Forward, Loss, and Gradients
        [loss, gradients, state] = dlfeval(@computeLoss, net, dlX, dlY);
        net.State = state;
        
        % Update weights using Adam
        [net, trailingAvg, trailingAvgSq] = adamupdate(net, gradients, ...
            trailingAvg, trailingAvgSq, iteration, learningRate);
        
        epochLoss = epochLoss + double(gather(extractdata(loss)));
    end
    
    epochLoss = epochLoss / numBatches;
    history.trainLoss(epoch) = epochLoss;
    
    % Validation Evaluation
    [valLoss, diceMA, diceHE, diceEX, diceSE, meanDice] = evaluateVal(net, valX, valY, valHasSE);
    history.valLoss(epoch) = valLoss;
    history.valDiceMA(epoch) = diceMA;
    history.valDiceHE(epoch) = diceHE;
    history.valDiceEX(epoch) = diceEX;
    history.valDiceSE(epoch) = diceSE;
    history.valMeanDice(epoch) = meanDice;
    
    epochTime = toc(tEpoch);
    
    fprintf('Epoch %02d/%02d [%.1fs] - Loss: %.4f | ValLoss: %.4f | Dice [MA: %.3f, HE: %.3f, EX: %.3f, SE: %.3f] Mean: %.3f', ...
        epoch, trainOpts.numEpochs, epochTime, epochLoss, valLoss, diceMA, diceHE, diceEX, diceSE, meanDice);
    
    if meanDice > bestValDice
        bestValDice = meanDice;
        bestEpoch = epoch;
        bestNet = net;
        fprintf('  *** BEST ***');
    end
    fprintf('\n');
end

totalTrainTime = toc(tTrainStart);
fprintf('\nTraining completed in %.1f minutes. Best Epoch: %d (Mean Val Dice: %.4f)\n', ...
    totalTrainTime / 60, bestEpoch, bestValDice);

%% 4. Save Checkpoints and Metadata
bestModelPath = fullfile(modelsDir, 'best_lesion_unet.mat');
finalModelPath = fullfile(modelsDir, 'final_lesion_unet.mat');
historyPath = fullfile(historiesDir, 'training_history.mat');
configJsonPath = fullfile(configsDir, 'training_config.json');

net = bestNet;
save(bestModelPath, 'net', 'bestValDice', 'bestEpoch', 'totalParams');
net = net; % final
save(finalModelPath, 'net', 'history', 'totalParams');
save(historyPath, 'history');

cfg = struct(...
    'architecture', 'U-Net 3-level', ...
    'totalParams', totalParams, ...
    'inputSize', [256, 256, 3], ...
    'numClasses', 4, ...
    'classNames', {{'MA', 'HE', 'EX', 'SE'}}, ...
    'numEpochs', trainOpts.numEpochs, ...
    'batchSize', trainOpts.batchSize, ...
    'initialLR', trainOpts.initialLR, ...
    'bestEpoch', bestEpoch, ...
    'bestValMeanDice', bestValDice, ...
    'trainingTimeMinutes', totalTrainTime / 60);
cfgJson = jsonencode(cfg, 'PrettyPrint', true);
fid = fopen(configJsonPath, 'w');
fwrite(fid, cfgJson, 'char');
fclose(fid);

trainingResults = cfg;
trainingResults.history = history;
end

%% Helper: Loss Function (Soft Dice + BCE)
function [loss, gradients, state] = computeLoss(net, X, Y)
[YPred, state] = forward(net, X);

% Binary Cross Entropy
eps_val = 1e-6;
bce = - (Y .* log(YPred + eps_val) + (1 - Y) .* log(1 - YPred + eps_val));
bce_loss = mean(bce, [1, 2]); % [1, 1, 4, B]

% Soft Dice Loss
inter = sum(Y .* YPred, [1, 2]);
denom = sum(Y.^2 + YPred.^2, [1, 2]);
dice_loss = 1 - (2 * inter + 1) ./ (denom + 1);

% Class weights: give balanced emphasis to sparse MA and SE
weights = [1.5, 1.0, 1.0, 1.2];
weights = reshape(weights, [1, 1, 4, 1]);

total_per_class = (bce_loss + dice_loss) .* weights;
loss = sum(total_per_class, 'all');

gradients = dlgradient(loss, net.Learnables);
end

%% Helper: Validation Evaluation
function [valLoss, diceMA, diceHE, diceEX, diceSE, meanDice] = evaluateVal(net, valX, valY, valHasSE)
N = size(valX, 4);
valBatchSize = 16;
numBatches = ceil(N / valBatchSize);

allPred = zeros(size(valY), 'single');
totalLoss = 0;

for b = 1:numBatches
    idx = (b-1)*valBatchSize + 1 : min(N, b*valBatchSize);
    dlX = dlarray(gpuArray(single(valX(:, :, :, idx))), 'SSCB');
    dlY = dlarray(gpuArray(single(valY(:, :, :, idx))), 'SSCB');
    
    YPred = predict(net, dlX);
    
    eps_val = 1e-6;
    bce = - (dlY .* log(YPred + eps_val) + (1 - dlY) .* log(1 - YPred + eps_val));
    inter = sum(dlY .* YPred, [1, 2]);
    denom = sum(dlY.^2 + YPred.^2, [1, 2]);
    dice = 1 - (2 * inter + 1) ./ (denom + 1);
    bLoss = sum(mean(bce, [1, 2]) + dice, 'all');
    
    totalLoss = totalLoss + double(gather(extractdata(bLoss)));
    allPred(:, :, :, idx) = double(gather(extractdata(YPred)));
end

valLoss = totalLoss / numBatches;

% Compute Binary Dice per class at standard threshold 0.5
binPred = allPred > 0.5;
binY = valY > 0.5;

calcDice = @(p, y) (2 * sum(p(:) & y(:)) + 1) / (sum(p(:)) + sum(y(:)) + 1);

diceMA = calcDice(binPred(:, :, 1, :), binY(:, :, 1, :));
diceHE = calcDice(binPred(:, :, 2, :), binY(:, :, 2, :));
diceEX = calcDice(binPred(:, :, 3, :), binY(:, :, 3, :));

% For SE, evaluate on patches from images that actually have SE ground truth
seMask = find(valHasSE);
if ~isempty(seMask)
    diceSE = calcDice(binPred(:, :, 4, seMask), binY(:, :, 4, seMask));
else
    diceSE = calcDice(binPred(:, :, 4, :), binY(:, :, 4, :));
end

meanDice = mean([diceMA, diceHE, diceEX, diceSE]);
end
