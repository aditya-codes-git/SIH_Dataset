function metrics = evaluateModelOnDataset(net, imds, experimentName)
% EVALUATEMODELONDATASET
% Runs model inference on an imageDatastore and calculates comprehensive
% 5-class and referable DR metrics.
%
% Inputs:
%   net            - Trained DAGNetwork / SeriesNetwork
%   imds           - imageDatastore (with true Labels)
%   experimentName - (Optional) Name for logging
%
% Output:
%   metrics        - Struct containing accuracy, precision, recall, f1, macroF1,
%                    qwk, confusion matrix, referable metrics, and full probabilities matrix.

if nargin < 3 || isempty(experimentName)
    experimentName = 'EXPERIMENT';
end

fprintf('\n[EVALUATION] Evaluating model for: %s (N = %d images)...\n', ...
    experimentName, numel(imds.Files));

% Batch classification
[preds, scores] = classify(net, imds);

trueLabels = imds.Labels;
trueNum = double(string(trueLabels));
predNum = double(string(preds));

numClasses = 5;
N = numel(trueNum);

% 1. Confusion Matrix (Rows = True, Cols = Pred)
cm = zeros(numClasses, numClasses);
for i = 1:N
    t = trueNum(i) + 1;
    p = predNum(i) + 1;
    cm(t, p) = cm(t, p) + 1;
end

% 2. Overall Accuracy
acc = sum(diag(cm)) / sum(cm(:));

% 3. Per-class Precision, Recall, F1
precision = zeros(numClasses, 1);
recall = zeros(numClasses, 1);
f1 = zeros(numClasses, 1);

for c = 1:numClasses
    tp = cm(c, c);
    fp = sum(cm(:, c)) - tp;
    fn = sum(cm(c, :)) - tp;
    
    precision(c) = tp / max(1, tp + fp);
    recall(c) = tp / max(1, tp + fn);
    if (precision(c) + recall(c)) > 0
        f1(c) = 2 * (precision(c) * recall(c)) / (precision(c) + recall(c));
    else
        f1(c) = 0;
    end
end

macroPrecision = mean(precision);
macroRecall = mean(recall);
macroF1 = mean(f1);

% 4. Quadratic Weighted Kappa (QWK)
qwk = computeQWK(trueNum, predNum, numClasses);

% 5. Referable DR (Grade >= 2) Metrics
trueRef = (trueNum >= 2);
predRef = (predNum >= 2);

refCM = zeros(2, 2);
% [TN, FP;
%  FN, TP]
for i = 1:N
    t = trueRef(i) + 1;
    p = predRef(i) + 1;
    refCM(t, p) = refCM(t, p) + 1;
end

TN = refCM(1, 1); FP = refCM(1, 2);
FN = refCM(2, 1); TP = refCM(2, 2);

refSensitivity = TP / max(1, (TP + FN)); % Recall for Referable
refSpecificity = TN / max(1, (TN + FP));
refPrecision   = TP / max(1, (TP + FP));
if (refPrecision + refSensitivity) > 0
    refF1 = 2 * (refPrecision * refSensitivity) / (refPrecision + refSensitivity);
else
    refF1 = 0;
end

% 6. Referable ROC-AUC calculation (sum of probabilities for Grades 2, 3, 4)
refProb = sum(scores(:, 3:5), 2); % P(Grade >= 2)
try
    [~, ~, ~, refAUC] = perfcurve(trueRef, refProb, true);
catch
    refAUC = NaN;
end

% Build return struct
metrics.experimentName   = experimentName;
metrics.numSamples       = N;
metrics.cm               = cm;
metrics.accuracy         = acc;
metrics.qwk              = qwk;
metrics.macroPrecision   = macroPrecision;
metrics.macroRecall      = macroRecall;
metrics.macroF1          = macroF1;
metrics.precision        = precision;
metrics.recall           = recall;
metrics.f1               = f1;
metrics.grade3Recall     = recall(4); % Grade 3
metrics.grade4Recall     = recall(5); % Grade 4
metrics.referableCM      = refCM;
metrics.refSensitivity   = refSensitivity;
metrics.refSpecificity   = refSpecificity;
metrics.refPrecision     = refPrecision;
metrics.refF1            = refF1;
metrics.refAUC           = refAUC;
metrics.probabilities    = scores;
metrics.trueNum          = trueNum;
metrics.predNum          = predNum;

fprintf('--- METRICS SUMMARY: %s ---\n', experimentName);
fprintf('  Accuracy:              %.2f%%\n', acc * 100);
fprintf('  QWK:                   %.4f\n', qwk);
fprintf('  Macro F1:              %.4f\n', macroF1);
fprintf('  Referable Sensitivity: %.2f%%\n', refSensitivity * 100);
fprintf('  Referable Specificity: %.2f%%\n', refSpecificity * 100);
fprintf('  Referable AUC:         %.4f\n', refAUC);
fprintf('  Grade 3 Recall:        %.2f%%\n', recall(4) * 100);
fprintf('  Grade 4 Recall:        %.2f%%\n', recall(5) * 100);
fprintf('---------------------------------------------------\n');

end
