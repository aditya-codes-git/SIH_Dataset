function out = extract_probabilities(net, inputData)
% EXTRACT_PROBABILITIES
% Extracts 5-class raw probabilities, logits, confidence, and predicted class
% from the frozen ResNet-18 model.
%
% Usage:
%   out = extract_probabilities(net, I)         % Single preprocessed image (224x224x3)
%   out = extract_probabilities(net, imds)      % ImageDatastore
%
% Output structure:
%   out.probabilities     - [N x 5] raw softmax probabilities
%   out.logits            - [N x 5] pre-softmax activations from 'new_fc'
%   out.rawConfidence     - [N x 1] maximum probability per sample
%   out.predictedClass    - [N x 1] predicted grade 0..4 (argmax of probabilities)
%   out.classes           - categorical classes [0 1 2 3 4]
%   out.classMapping      - struct describing grade 0..4 labels

classes = categorical(0:4);
classMapping = struct(...
    'Grade0', 'No DR', ...
    'Grade1', 'Mild NPDR', ...
    'Grade2', 'Moderate NPDR', ...
    'Grade3', 'Severe NPDR', ...
    'Grade4', 'Proliferative DR');

if isa(inputData, 'matlab.io.datastore.ImageDatastore') || isa(inputData, 'augmentedImageDatastore')
    % Batch extraction
    logits = activations(net, inputData, 'new_fc', 'OutputAs', 'rows', 'MiniBatchSize', 32);
    [preds, scores] = classify(net, inputData, 'MiniBatchSize', 32);
    numSamples = size(scores, 1);
    predGrades = double(string(preds));
    conf = max(scores, [], 2);
else
    % Single image (224x224x3 uint8 or single)
    I = inputData;
    if size(I, 1) ~= 224 || size(I, 2) ~= 224 || size(I, 3) ~= 3
        error('Input image must be 224x224x3');
    end
    rawLogits = activations(net, I, 'new_fc');
    logits = reshape(squeeze(rawLogits), 1, 5);
    [preds, scores] = classify(net, I);
    predGrades = double(string(preds));
    conf = max(scores, [], 2);
end

% Ensure exact softmax probabilities from logits if classify scores have rounding
expZ = exp(double(logits) - max(double(logits), [], 2));
probabilities = expZ ./ sum(expZ, 2);

out = struct();
out.probabilities = probabilities;
out.logits = double(logits);
out.rawConfidence = conf;
out.predictedClass = predGrades;
out.classes = classes;
out.classMapping = classMapping;

end
