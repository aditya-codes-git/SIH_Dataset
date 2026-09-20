function kappa = computeQWK(yTrue, yPred, numClasses)
% COMPUTEQWK Calculates Quadratic Weighted Kappa (QWK) for ordinal classification.
%
% Inputs:
%   yTrue      - Vector of ground truth labels (0 to numClasses-1)
%   yPred      - Vector of predicted labels (0 to numClasses-1)
%   numClasses - (Optional) Number of ordinal grades (default: 5, for grades 0..4)
%
% Output:
%   kappa      - Quadratic Weighted Kappa value in [-1, 1]
%
% Formula:
%   w(i,j) = ((i - j)^2) / ((K - 1)^2)
%   O(i,j) = Observed confusion matrix
%   E(i,j) = Expected matrix under independence = (histTrue * histPred') / N
%   kappa  = 1 - sum(w .* O) / sum(w .* E)

if nargin < 3 || isempty(numClasses)
    numClasses = 5;
end

yTrue = double(yTrue(:));
yPred = double(yPred(:));

if numel(yTrue) ~= numel(yPred)
    error('yTrue and yPred must have the same number of elements.');
end

N = numel(yTrue);
if N == 0
    kappa = 0;
    return;
end

% Construct observed confusion matrix O of size [numClasses, numClasses]
% Classes are 0-indexed: 0, 1, ..., numClasses-1
O = zeros(numClasses, numClasses);
for i = 1:N
    t = yTrue(i) + 1; % 1-indexed
    p = yPred(i) + 1;
    if t >= 1 && t <= numClasses && p >= 1 && p <= numClasses
        O(t, p) = O(t, p) + 1;
    end
end

% Marginal distributions
histTrue = sum(O, 2); % [K x 1]
histPred = sum(O, 1); % [1 x K]

% Expected confusion matrix under chance agreement
E = (histTrue * histPred) / N;

% Weight matrix (quadratic penalty)
w = zeros(numClasses, numClasses);
denom = (numClasses - 1)^2;
for i = 1:numClasses
    for j = 1:numClasses
        w(i, j) = ((i - j)^2) / denom;
    end
end

% Normalize O and E
sumO = sum(O(:));
sumE = sum(E(:));

if sumO > 0; O = O / sumO; end
if sumE > 0; E = E / sumE; end

% Calculate weighted sums
num = sum(sum(w .* O));
den = sum(sum(w .* E));

if den == 0
    kappa = 1.0;
else
    kappa = 1.0 - (num / den);
end

end
