function hardCases = hard_case_analysis(net, testImds, testIds, expName)
% HARD_CASE_ANALYSIS
% Analyzes difficult cases on the test dataset:
%   - High-confidence incorrect predictions (conf > 0.70 but wrong)
%   - Severe DR (Grade 3) confused with Moderate DR (Grade 2)
%   - Proliferative DR (Grade 4) confused with Grade 2
%   - Mild DR (Grade 1) confused with Grade 2
%   - Referable false negatives (True >= 2, Pred < 2)
%
% Output:
%   hardCases - Struct array of detailed diagnostic cases

if nargin < 4 || isempty(expName)
    expName = 'FINAL_MODEL';
end

baseDir = fileparts(mfilename('fullpath'));
fprintf('\n[HARD CASE ANALYSIS] Running diagnostic inspection for: %s...\n', expName);

[preds, scores] = classify(net, testImds);
trueLabels = testImds.Labels;
trueNum = double(string(trueLabels));
predNum = double(string(preds));
conf = max(scores, [], 2);

N = numel(trueNum);
cases = struct('id_code', {}, 'trueGrade', {}, 'predGrade', {}, 'confidence', {}, ...
    'probabilities', {}, 'caseType', {});

for i = 1:N
    t = trueNum(i);
    p = predNum(i);
    c = conf(i);
    id = testIds(i);
    probs = scores(i, :);
    
    isHard = false;
    caseType = strings(0);
    
    % 1. High-confidence errors
    if t ~= p && c >= 0.70
        isHard = true;
        caseType(end+1) = "High-Confidence Error";
    end
    
    % 2. Grade 3 -> Grade 2 confusion
    if t == 3 && p == 2
        isHard = true;
        caseType(end+1) = "Grade 3 Under-called as Grade 2";
    end
    
    % 3. Grade 4 -> Grade 2 confusion
    if t == 4 && p == 2
        isHard = true;
        caseType(end+1) = "Grade 4 Under-called as Grade 2";
    end
    
    % 4. Grade 1 -> Grade 2 confusion
    if t == 1 && p == 2
        isHard = true;
        caseType(end+1) = "Grade 1 Over-called as Grade 2";
    end
    
    % 5. Critical Referable False Negative
    if t >= 2 && p < 2
        isHard = true;
        caseType(end+1) = "CRITICAL: Referable False Negative";
    end
    
    if isHard
        idx = numel(cases) + 1;
        cases(idx).id_code       = char(id);
        cases(idx).trueGrade     = t;
        cases(idx).predGrade     = p;
        cases(idx).confidence    = c;
        cases(idx).probabilities = probs;
        cases(idx).caseType      = strjoin(caseType, " | ");
    end
end

hardCases = cases;
fprintf('[HARD CASE ANALYSIS] Identified %d hard / clinical edge cases out of %d samples.\n', ...
    numel(hardCases), N);

% Save to MAT
outMat = fullfile(baseDir, 'metrics', [lower(strrep(expName, '-', '_')), '_hard_cases.mat']);
save(outMat, 'hardCases');
fprintf('Saved hard cases MAT to: %s\n', outMat);

end
