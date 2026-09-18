function metrics = eval_preprocessed()
% EVAL_PREPROCESSED
% Evaluates the newly trained model (trained_dr_model_preprocessed.mat)
% on the exact same 20% validation split (rng(42)) using preprocessed images.

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

disp(['Total validation images: ', num2str(length(valImds.Files))]);

load('trained_dr_model_preprocessed.mat', 'trainedNet');

disp('Evaluating preprocessed model on validation set...');
[preds, scores] = classify(trainedNet, valImds);

% Convert to numeric for confusion matrices & referral logic
trueNum = str2double(string(valImds.Labels));
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
disp('            PREPROCESSED MODEL EVALUATION METRICS          ');
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

save('preprocessed_eval_metrics.mat', 'metrics');

end
