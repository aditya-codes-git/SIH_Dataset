function [classWeights, weightsTable] = createWeightedLoss(trainLabels, mode)
% CREATEWEIGHTEDLOSS
% Computes class weights strictly from the TRAIN split labels to mitigate class imbalance.
%
% Inputs:
%   trainLabels  - Categorical or numeric vector of training labels (0 to 4)
%   mode         - 'moderated' (default, sqrt-smoothed) or 'inverse'
%
% Outputs:
%   classWeights - [5 x 1] vector of weights for Grades 0, 1, 2, 3, 4
%   weightsTable - Summary table of counts and weights

if nargin < 2 || isempty(mode)
    mode = 'moderated';
end

numLabels = double(string(trainLabels));
numClasses = 5;
counts = zeros(numClasses, 1);
for c = 0:(numClasses - 1)
    counts(c + 1) = sum(numLabels == c);
end

totalSamples = sum(counts);

switch lower(mode)
    case 'inverse'
        % Standard inverse frequency: w = N / (K * Nc)
        rawWeights = totalSamples ./ (numClasses * max(1, counts));
        classWeights = rawWeights / mean(rawWeights); % Normalize to mean = 1
    case 'moderated'
        % Moderated square-root inverse frequency: w = sqrt(N / Nc)
        rawWeights = sqrt(totalSamples ./ max(1, counts));
        classWeights = (rawWeights / sum(rawWeights)) * numClasses; % Normalize sum = 5
    otherwise
        error('Unknown mode: %s. Use "moderated" or "inverse".', mode);
end

weightsTable = table((0:4)', counts, classWeights, ...
    'VariableNames', {'Grade', 'TrainingCount', 'Weight'});

fprintf('\n=== CLASS WEIGHT DISTRIBUTION (Mode: %s) ===\n', mode);
disp(weightsTable);

end
