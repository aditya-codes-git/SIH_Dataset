function train_preprocessed_model()
% TRAIN_PREPROCESSED_MODEL
% Trains a ResNet-18 model on Kaggle-preprocessed APTOS fundus images.
% Saves trained model as trained_dr_model_preprocessed.mat.
% DOES NOT overwrite trained_dr_model.mat.

rng(42); % Fixed seed matching baseline evaluation split

data = readtable('train.csv', 'TextType', 'string');
imdsRaw = imageDatastore('processed_train_images', ...
    'FileExtensions',{'.png','.jpg','.jpeg'});

% Match files to exact train.csv labels
[~, fileNames, ~] = fileparts(imdsRaw.Files);
[found, loc] = ismember(string(fileNames), data.id_code);

validFiles = imdsRaw.Files(found);
validLabels = categorical(data.diagnosis(loc(found)));

imds = imageDatastore(validFiles);
imds.Labels = validLabels;

[trainImds, valImds] = splitEachLabel(imds, 0.8, 'randomized');

disp(['Training images: ', num2str(length(trainImds.Files))]);
disp(['Validation images: ', num2str(length(valImds.Files))]);

% Load base ResNet-18 architecture
net = resnet18;
lgraph = layerGraph(net);

% Replace final layers for 5 classes (0, 1, 2, 3, 4)
numClasses = 5;

newFc = fullyConnectedLayer(numClasses, 'Name', 'new_fc', ...
    'WeightLearnRateFactor', 10, 'BiasLearnRateFactor', 10);
newClassLayer = classificationLayer('Name', 'new_classoutput');

lgraph = replaceLayer(lgraph, 'fc1000', newFc);
lgraph = replaceLayer(lgraph, 'ClassificationLayer_predictions', newClassLayer);

% Training options (optimized for RTX 4050 GPU, miniBatchSize 32, 6 Epochs)
options = trainingOptions('adam', ...
    'MiniBatchSize', 32, ...
    'MaxEpochs', 6, ...
    'InitialLearnRate', 1e-4, ...
    'Shuffle', 'every-epoch', ...
    'ValidationData', valImds, ...
    'ValidationFrequency', 20, ...
    'Verbose', true, ...
    'Plots', 'none');

disp('Starting training for Experiment B (ResNet-18 + Kaggle Preprocessing)...');
trainedNet = trainNetwork(trainImds, lgraph, options);

% Save to trained_dr_model_preprocessed.mat
save('trained_dr_model_preprocessed.mat', 'trainedNet');
disp('===========================================================');
disp('  TRAINING COMPLETED — SAVED trained_dr_model_preprocessed.mat ');
disp('===========================================================');

end
