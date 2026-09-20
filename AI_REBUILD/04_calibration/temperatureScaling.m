function out = temperatureScaling(logits, T)
% TEMPERATURESCALING
% Applies post-hoc temperature scaling to pre-softmax logits:
%   p_i(T) = exp(z_i / T) / sum_j(exp(z_j / T))
%
% Inputs:
%   logits - [N x 5] pre-softmax activations from the network
%   T      - scalar temperature parameter (T > 0)
%
% Output:
%   out.calibratedProbabilities - [N x 5] calibrated probability distribution
%   out.calibratedConfidence    - [N x 1] maximum calibrated probability
%   out.referableRiskProbability - [N x 1] sum of P(Grade 2, 3, 4)
%   out.nonReferableRiskProbability - [N x 1] sum of P(Grade 0, 1)
%   out.temperature             - scalar T used

if nargin < 2 || isempty(T)
    T = 1.0;
end

if T <= 0
    error('Temperature T must be strictly positive (T > 0).');
end

% Stable numerical softmax computation
scaledLogits = double(logits) ./ double(T);
maxLogits = max(scaledLogits, [], 2);
expLogits = exp(scaledLogits - maxLogits);
calibratedProbabilities = expLogits ./ sum(expLogits, 2);

% Extract confidence and referable risk
calibratedConfidence = max(calibratedProbabilities, [], 2);
referableRisk = sum(calibratedProbabilities(:, 3:5), 2);
nonReferableRisk = sum(calibratedProbabilities(:, 1:2), 2);

out = struct();
out.calibratedProbabilities = calibratedProbabilities;
out.calibratedConfidence = calibratedConfidence;
out.referableRiskProbability = referableRisk;
out.nonReferableRiskProbability = nonReferableRisk;
out.temperature = double(T);

end
