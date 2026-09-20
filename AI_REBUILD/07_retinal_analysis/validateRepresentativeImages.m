function resultsTable = validateRepresentativeImages()
% VALIDATEREPRESENTATIVEIMAGES
% Runs Phase 5 Retinal Anatomical Analysis across representative APTOS images:
%   - Grade 0 (No DR)
%   - Grade 1 (Mild NPDR)
%   - Grade 2 (Moderate NPDR)
%   - Grade 3 (Severe NPDR)
%   - Grade 4 (Proliferative DR)
%   - Difficult Grade 3 Case
%
% Saves visual analysis composites to AI_REBUILD/07_retinal_analysis/validation_gallery/

fprintf('===========================================================\n');
fprintf('  RUNNING PHASE 5 VALIDATION GALLERY PIPELINE              \n');
fprintf('===========================================================\n');

baseDir = fileparts(fileparts(mfilename('fullpath'))); % AI_REBUILD/
repoDir = fileparts(baseDir);
addpath(fullfile(baseDir, '07_retinal_analysis'));
addpath(fullfile(baseDir, '06_explainability'));
addpath(fullfile(baseDir, '04_calibration'));
addpath(fullfile(baseDir, '02_training'));
addpath(repoDir);

galleryDir = fullfile(baseDir, '07_retinal_analysis', 'validation_gallery');
if ~exist(galleryDir, 'dir'), mkdir(galleryDir); end

cases = {
    struct('id', '0125fbd2e791', 'grade', 0, 'desc', 'Grade 0 (No DR)'), ...
    struct('id', '0684311afdfc', 'grade', 1, 'desc', 'Grade 1 (Mild NPDR)'), ...
    struct('id', '064af6592ba6', 'grade', 2, 'desc', 'Grade 2 (Moderate NPDR)'), ...
    struct('id', '069f43616fab', 'grade', 3, 'desc', 'Grade 3 (Severe NPDR)'), ...
    struct('id', '07122e268a1d', 'grade', 4, 'desc', 'Grade 4 (Proliferative DR)'), ...
    struct('id', '1623e8e3adc4', 'grade', 3, 'desc', 'Difficult Grade 3 Case')
};

numCases = length(cases);
resultsTable = cell(numCases, 9);

for c = 1:numCases
    caseInfo = cases{c};
    imgPath = fullfile(repoDir, 'train_images', sprintf('%s.png', caseInfo.id));
    if ~exist(imgPath, 'file')
        warning('Image file missing: %s', imgPath);
        continue;
    end
    
    fprintf('Analyzing %s (%s)...\n', caseInfo.id, caseInfo.desc);
    caseOutDir = fullfile(galleryDir, sprintf('case_%s', caseInfo.id));
    res = runFullRetinalAnalysis(imgPath, caseOutDir);
    
    odStr = sprintf('No');
    if res.opticDisc.detected, odStr = sprintf('Yes (conf=%.2f)', res.opticDisc.algorithmicConfidence); end
    
    macStr = sprintf('No');
    if res.macula.estimated, macStr = sprintf('Yes (conf=%.2f)', res.macula.algorithmicConfidence); end
    
    vessStr = sprintf('No');
    if res.vessels.available, vessStr = sprintf('Yes (%.1f%%)', res.vessels.vesselAreaRatio * 100); end
    
    numCands = length(res.candidateFindings);
    numHotspots = length(res.hotspots);
    numSupported = sum([res.evidenceRegions.supportedByModelAttention]);
    
    resultsTable{c, 1} = caseInfo.id;
    resultsTable{c, 2} = caseInfo.desc;
    resultsTable{c, 3} = sprintf('%.1f%%', res.retinalField.coverageRatio * 100);
    resultsTable{c, 4} = odStr;
    resultsTable{c, 5} = macStr;
    resultsTable{c, 6} = vessStr;
    resultsTable{c, 7} = numCands;
    resultsTable{c, 8} = numHotspots;
    resultsTable{c, 9} = numSupported;
    
    fprintf('  -> Field: %s | OD: %s | Mac: %s | Vessels: %s | Cands: %d | Hotspots: %d (Supported: %d)\n', ...
        resultsTable{c, 3}, odStr, macStr, vessStr, numCands, numHotspots, numSupported);
end

fprintf('\nSummary of Phase 5 Anatomical Analysis across Representative Cases:\n');
fprintf('%-14s | %-24s | Field Cov | Optic Disc  | Macula      | Vessels     | Cands | Hotspots | Supported\n', ...
    'Image ID', 'Description');
fprintf('%s\n', repmat('-', 1, 105));
for c = 1:numCases
    fprintf('%-14s | %-24s | %9s | %-11s | %-11s | %-11s | %5d | %8d | %9d\n', ...
        resultsTable{c, 1}, resultsTable{c, 2}, resultsTable{c, 3}, resultsTable{c, 4}, ...
        resultsTable{c, 5}, resultsTable{c, 6}, resultsTable{c, 7}, resultsTable{c, 8}, resultsTable{c, 9});
end

end
