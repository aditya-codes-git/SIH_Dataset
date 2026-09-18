function metrics = eval_baseline()
% EVAL_BASELINE
% Evaluates the existing deployed baseline model (trained_dr_model.mat)
% on a fixed 20% validation split without Kaggle preprocessing.

rng(42); % Fixed seed for exact reproducible evaluation split

data = readtable('train.csv');
imds = imageDatastore('train_images', ...
    'FileExtensions',{'.png','.jpg','.jpeg'});
imds.Labels = categorical(data.diagnosis);

[trainImds, valImds] = splitEachLabel(imds, 0.8, 'randomized');

disp(['Total validation images: ', num2str(length(valImds.Files))]);

load('trained_dr_model.mat', 'trainedNet');
inputSize = trainedNet.Layers(1).InputSize;

% Pre-allocate predictions
numVal = length(valImds.Files);
preds = categorical(zeros(numVal, 1), 0:4);
trueLabels = valImds.Labels;

disp('Evaluating baseline model on validation set...');
for i = 1:numVal
    img = imread(valImds.Files{i});
    imgProcessed = imresize(img, inputSize(1:2));
    imgProcessed = double(imgProcessed) / 255;
    if size(imgProcessed, 3) == 1
        imgProcessed = repmat(imgProcessed, 1, 1, 3);
    end
    
    p = classify(trainedNet, imgProcessed);
    preds(i) = p;
    
    if mod(i, 200) == 0
        disp(['Processed ', num2str(i), '/', num2str(numVal)]);
    end
end

% Convert to numeric for confusion matrices & referral logic
trueNum = str2double(string(trueLabels));
predNum = str2double(string(preds));

% Confusion Matrix
cm = confusionmat(trueNum, predNum);

% Overall Accuracy
acc = sum(diag(cm)) / sum(cm(:));

% Referable DR (Grade >= 2) Metrics
trueReferable = trueNum >= 2;
predReferable = predNum >= 2;

referableCM = confusionmat(trueReferable, predReferable);
% referableCM format:
% [TN, FP;
%  FN, TP]
TN = referableCM(1,1); FP = referableCM(1,2);
FN = referableCM(2,1); TP = referableCM(2,2);

sensitivity = TP / max(1, (TP + FN));
specificity = TN / max(1, (TN + FP));

% Per-class Precision & Recall
numClasses = 5;
precision = zeros(numClasses, 1);
recall = zeros(numClasses, 1);
for c = 1:numClasses
    tp_c = cm(c, c);
    fp_c = sum(cm(:, c)) - tp_c;
    fn_c = sum(cm(c, :)) - tp_c;
    
    precision(c) = tp_c / max(1, (tp_c + fp_c));
    recall(c) = tp_c / max(1, (tp_c + fn_c));
end

metrics.cm = cm;
metrics.accuracy = acc;
metrics.referableSensitivity = sensitivity;
metrics.referableSpecificity = specificity;
metrics.precision = precision;
metrics.recall = recall;

disp('===========================================================');
disp('              BASELINE MODEL EVALUATION METRICS            ');
disp('===========================================================');
disp(['Overall Accuracy:          ', num2str(acc * 100, '%.2f'), '%']);
disp(['Grade 2-4 Sensitivity:     ', num2str(sensitivity * 100, '%.2f'), '%']);
disp(['Grade 2-4 Specificity:     ', num2str(specificity * 100, '%.2f'), '%']);
disp('Confusion Matrix (Rows=True 0-4, Cols=Pred 0-4):');
disp(cm);
disp('Per-Class Precision (Grade 0 to 4):');
disp(precision');
disp('Per-Class Recall (Grade 0 to 4):');
disp(recall');
disp('===========================================================');

save('baseline_eval_metrics.mat', 'metrics');

end
