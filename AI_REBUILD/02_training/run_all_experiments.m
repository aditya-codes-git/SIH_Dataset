function run_all_experiments()
% RUN_ALL_EXPERIMENTS
% Master execution script for Phase 2:
% Trains Experiments A through E, evaluates on CALIBRATION set,
% selects the best candidate, and evaluates once on held-out TEST set.

baseDir = fileparts(mfilename('fullpath'));
evalDir = fullfile(baseDir, '..', '03_evaluation');
addpath(baseDir);
addpath(evalDir);

experiments = {
    'R18-V2-BASELINE', ...
    'R18-AUG', ...
    'R18-WEIGHTED', ...
    'R18-AUG-WEIGHTED', ...
    'R18-FINAL-CANDIDATE'
};

numExps = numel(experiments);
allMetrics = cell(numExps, 1);
allNets = cell(numExps, 1);

fprintf('===========================================================\n');
fprintf('  STARTING PHASE 2 EXPERIMENT MATRIX (N = %d Experiments)  \n', numExps);
fprintf('===========================================================\n');

for e = 1:numExps
    expName = experiments{e};
    fprintf('\n>>> [%d/%d] Executing: %s <<<\n', e, numExps, expName);
    [net, valMetrics] = run_experiment(expName);
    allNets{e} = net;
    allMetrics{e} = valMetrics;
end

% Save calibration comparison MAT
calibMat = fullfile(evalDir, 'metrics', 'calibration_comparison.mat');
save(calibMat, 'experiments', 'allMetrics');
fprintf('\nSaved calibration comparison metrics to: %s\n', calibMat);

% Compute selection scores
% Selection Criterion: 40% QWK + 30% Macro F1 + 20% Referable Sensitivity + 10% Referable Specificity
scores = zeros(numExps, 1);
for e = 1:numExps
    m = allMetrics{e};
    scores(e) = 0.40 * m.qwk + ...
                0.30 * m.macroF1 + ...
                0.20 * m.refSensitivity + ...
                0.10 * m.refSpecificity;
end

[bestScore, bestIdx] = max(scores);
bestExpName = experiments{bestIdx};
bestNet = allNets{bestIdx};

fprintf('\n===========================================================\n');
fprintf('  CALIBRATION SET MODEL SELECTION RESULTS                 \n');
fprintf('===========================================================\n');
for e = 1:numExps
    m = allMetrics{e};
    fprintf('%-20s | Acc: %5.2f%% | QWK: %6.4f | MacroF1: %6.4f | RefSens: %5.2f%% | RefSpec: %5.2f%% | Score: %6.4f\n', ...
        experiments{e}, m.accuracy*100, m.qwk, m.macroF1, m.refSensitivity*100, m.refSpecificity*100, scores(e));
end
fprintf('\n>>> WINNING MODEL SELECTED: %s (Score: %.4f) <<<\n', bestExpName, bestScore);

% Write MODEL_COMPARISON.md
compMdPath = fullfile(evalDir, 'MODEL_COMPARISON.md');
fid = fopen(compMdPath, 'w');
fprintf(fid, '# RetinoScan AI — Phase 2 Model Comparison Report\n\n');
fprintf(fid, '**Evaluation Set:** CALIBRATION / VALIDATION Partition (N = 550 images)\n');
fprintf(fid, '**Selection Criterion:** 0.40 × QWK + 0.30 × Macro F1 + 0.20 × Ref Sens + 0.10 × Ref Spec\n\n');
fprintf(fid, '| Experiment | Accuracy | Macro F1 | QWK | Referable Sens | Referable Spec | Grade 3 Recall | Grade 4 Recall | Selection Score |\n');
fprintf(fid, '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n');
for e = 1:numExps
    m = allMetrics{e};
    fprintf(fid, '| **%s** | %.2f%% | %.4f | %.4f | %.2f%% | %.2f%% | %.2f%% | %.2f%% | **%.4f** |\n', ...
        experiments{e}, m.accuracy*100, m.macroF1, m.qwk, m.refSensitivity*100, m.refSpecificity*100, ...
        m.grade3Recall*100, m.grade4Recall*100, scores(e));
end
fprintf(fid, '\n### Selection Conclusion\n\n');
fprintf(fid, '**Winning Model:** `%s` achieved the highest composite clinical score (%.4f), demonstrating superior balance across ordinal agreement (QWK), severe grade recall, and referable sensitivity.\n', ...
    bestExpName, bestScore);
fclose(fid);
fprintf('Written comparison markdown: %s\n', compMdPath);

% 10. EVALUATE ONCE ON HELD-OUT TEST SET (N = 548)
fprintf('\n===========================================================\n');
fprintf('  EVALUATING SELECTED MODEL ON HELD-OUT TEST SET (N = 548) \n');
fprintf('===========================================================\n');
[testImds, testIds, testLabels] = loadCanonicalDataset('TEST', true);
testMetrics = evaluateModelOnDataset(bestNet, testImds, [bestExpName, ' (FINAL TEST)']);

% Run hard case analysis on TEST set
hardCases = hard_case_analysis(bestNet, testImds, testIds, bestExpName);

% Save final_test_results.mat
finalTestMat = fullfile(evalDir, 'final_test_results.mat');
save(finalTestMat, 'bestExpName', 'testMetrics', 'hardCases');
fprintf('Saved final test results MAT: %s\n', finalTestMat);

% Write FINAL_MODEL_EVALUATION.md
finalEvalMd = fullfile(evalDir, 'FINAL_MODEL_EVALUATION.md');
fid = fopen(finalEvalMd, 'w');
fprintf(fid, '# RetinoScan AI — Final Model Evaluation on Held-Out Test Set\n\n');
fprintf(fid, '**Selected Model Architecture:** ResNet-18 (`%s`)\n', bestExpName);
fprintf(fid, '**Held-Out Test Sample Size:** N = 548 fundus images (Completely untouched during training/tuning)\n\n');

fprintf(fid, '## 1. Primary Benchmark Metrics\n\n');
fprintf(fid, '| Metric | Test Result | Description |\n');
fprintf(fid, '| :--- | :---: | :--- |\n');
fprintf(fid, '| **Overall Accuracy** | **%.2f%%** | Total correct predictions across 5 classes |\n', testMetrics.accuracy*100);
fprintf(fid, '| **Quadratic Weighted Kappa (QWK)** | **%.4f** | Ordinal clinical agreement (APTOS competition benchmark) |\n', testMetrics.qwk);
fprintf(fid, '| **Macro F1 Score** | **%.4f** | Unweighted mean of F1 scores across Grades 0–4 |\n', testMetrics.macroF1);
fprintf(fid, '| **Referable DR Sensitivity (Grade >= 2)** | **%.2f%%** | Recall of vision-threatening DR cases |\n', testMetrics.refSensitivity*100);
fprintf(fid, '| **Referable DR Specificity (Grade >= 2)** | **%.2f%%** | Specificity on non-referable cases (Grade 0–1) |\n', testMetrics.refSpecificity*100);
fprintf(fid, '| **Referable DR AUC-ROC** | **%.4f** | Area under the ROC curve for referable detection |\n', testMetrics.refAUC);
fprintf(fid, '| **Referable DR Precision** | **%.2f%%** | Positive predictive value for referral |\n', testMetrics.refPrecision*100);
fprintf(fid, '| **Referable DR F1 Score** | **%.4f** | Harmonic mean of referable precision & sensitivity |\n', testMetrics.refF1);

fprintf(fid, '\n## 2. 5-Class Confusion Matrix (Held-Out Test Set)\n\n');
fprintf(fid, '```\n');
fprintf(fid, '             Pred 0   Pred 1   Pred 2   Pred 3   Pred 4\n');
for r = 1:5
    fprintf(fid, 'True Grade %d: %7d  %7d  %7d  %7d  %7d\n', ...
        r-1, testMetrics.cm(r,1), testMetrics.cm(r,2), testMetrics.cm(r,3), testMetrics.cm(r,4), testMetrics.cm(r,5));
end
fprintf(fid, '```\n\n');

fprintf(fid, '## 3. Per-Class Diagnostic Performance\n\n');
fprintf(fid, '| Grade | Clinical Category | Precision | Recall (Sensitivity) | F1 Score |\n');
fprintf(fid, '| :---: | :--- | :---: | :---: | :---: |\n');
gradeNames = { ...
    'No DR', ...
    'Mild NPDR', ...
    'Moderate NPDR', ...
    'Severe NPDR', ...
    'Proliferative DR' ...
};
for g = 1:5
    fprintf(fid, '| **Grade %d** | %s | %.2f%% | %.2f%% | %.4f |\n', ...
        g-1, gradeNames{g}, testMetrics.precision(g)*100, testMetrics.recall(g)*100, testMetrics.f1(g));
end

fprintf(fid, '\n## 4. Hard Case Analysis Summary\n\n');
fprintf(fid, 'Total diagnostic edge cases identified: **%d** / 548 (%.2f%%).\n\n', ...
    numel(hardCases), (numel(hardCases)/548)*100);
fprintf(fid, 'Full case details saved to: `AI_REBUILD/03_evaluation/metrics/%s_hard_cases.mat`.\n', ...
    lower(strrep(bestExpName, '-', '_')));

fclose(fid);
fprintf('Written final evaluation report: %s\n', finalEvalMd);

fprintf('\n===========================================================\n');
fprintf('          PHASE 2 EXPERIMENTS COMPLETED SUCCESSFULLY       \n');
fprintf('===========================================================\n');

end
