function generateRefinedGradcamComparison()
% GENERATEREFINEDGRADCAMCOMPARISON
% Produces side-by-side comparative visualizations across DR grades:
%   Panel 1: Original High-Resolution Fundus Image
%   Panel 2: Phase-4 Single-Layer Grad-CAM ('res5b_relu' diffuse activation)
%   Panel 3: Phase-4.5 Refined Multi-Scale Grad-CAM (res5b + res4b + Multi-Peak NMS Hotspots)
%
% Saves figures to AI_REBUILD/06_explainability/comparisons/refined/

fprintf('===========================================================\n');
fprintf('  GENERATING PHASE 4.5 REFINED GRAD-CAM COMPARISONS        \n');
fprintf('===========================================================\n');

baseDir = fileparts(fileparts(mfilename('fullpath'))); % AI_REBUILD/
repoDir = fileparts(baseDir);
addpath(fullfile(baseDir, '06_explainability'));
addpath(fullfile(baseDir, '02_training'));
addpath(repoDir);

compDir = fullfile(baseDir, '06_explainability', 'comparisons', 'refined');
if ~exist(compDir, 'dir'), mkdir(compDir); end

% Representative Test Cases (Grades 0-4, high confidence, difficult)
cases = {
    struct('id', '0125fbd2e791', 'grade', 0, 'desc', 'Grade 0 (No DR)'), ...
    struct('id', '0684311afdfc', 'grade', 1, 'desc', 'Grade 1 (Mild NPDR)'), ...
    struct('id', '064af6592ba6', 'grade', 2, 'desc', 'Grade 2 (Moderate NPDR)'), ...
    struct('id', '069f43616fab', 'grade', 3, 'desc', 'Grade 3 (Severe NPDR)'), ...
    struct('id', '07122e268a1d', 'grade', 4, 'desc', 'Grade 4 (Proliferative DR)'), ...
    struct('id', '000c1434d8d7', 'grade', 2, 'desc', 'High-Confidence Moderate (98.4%)'), ...
    struct('id', '1623e8e3adc4', 'grade', 3, 'desc', 'Difficult Severe NPDR Case (Predicted Gr2)')
};

frozenModelFile = fullfile(baseDir, '02_training', 'models', 'trained_dr_model_r18_final_candidate.mat');

numCases = length(cases);

for c = 1:numCases
    caseInfo = cases{c};
    imgPath = fullfile(repoDir, 'train_images', sprintf('%s.png', caseInfo.id));
    if ~exist(imgPath, 'file')
        warning('Image file missing: %s', imgPath);
        continue;
    end
    
    fprintf('Processing %s (%s)...\n', caseInfo.id, caseInfo.desc);
    origImg = imread(imgPath);
    [H, W, ~] = size(origImg);
    
    % 1. GENERATE PHASE-4 SINGLE-LAYER GRAD-CAM (res5b only)
    resP4 = generateImprovedGradCAM(origImg, 'ModelFile', frozenModelFile, 'Strategy', 'res5b_relu');
    
    % 2. GENERATE PHASE-4.5 REFINED MULTI-SCALE GRAD-CAM WITH MULTI-PEAK HOTSPOTS
    resP45 = generateImprovedGradCAM(origImg, 'ModelFile', frozenModelFile, 'Strategy', 'MultiScaleFusion');
    [hotspotsP45, statsP45] = extractAttentionHotspots(resP45.heatmap, resP45.retinalMask, 'TopK', 5);
    refinedWithHotspots = renderAttentionPoints(resP45.overlayImage, hotspotsP45);
    
    % 3. COMPOSE 3-PANEL COMPARISON FIGURE
    figComp = figure('Visible', 'off', 'Position', [100 100 1450 480]);
    
    % Panel 1: Original High-Res
    subplot(1, 3, 1);
    imshow(origImg);
    title(sprintf('Original Fundus Photo\nResolution: %dx%d', W, H), 'FontSize', 12, 'FontWeight', 'bold');
    
    % Panel 2: Phase-4 Single-Layer Grad-CAM
    subplot(1, 3, 2);
    imshow(resP4.overlayImage);
    title(sprintf('Phase 4: Single-Layer (res5b)\nDiffuse Area Ratio: %.1f%%', mean(resP4.heatmap(resP4.retinalMask) > 0.35)*100), ...
        'FontSize', 12, 'FontWeight', 'bold');
    
    % Panel 3: Refined Phase 4.5 Multi-Scale with Multi-Peak Hotspots
    subplot(1, 3, 3);
    imshow(refinedWithHotspots);
    title(sprintf('Phase 4.5 Refined: Multi-Scale Fusion\nFocal Area: %.1f%% | %d Compact Hotspots', ...
        statsP45.activatedAreaRatio*100, statsP45.hotspotCount), ...
        'FontSize', 12, 'FontWeight', 'bold');
    
    sgtitle(sprintf('RetinoScan AI Localization Refinement: %s [ID: %s]', caseInfo.desc, caseInfo.id), ...
        'FontSize', 14, 'FontWeight', 'bold');
    
    outPng = fullfile(compDir, sprintf('refined_comparison_gr%d_%s.png', caseInfo.grade, caseInfo.id));
    saveas(figComp, outPng);
    close(figComp);
    fprintf('  Saved: %s (Hotspots: %d, Area Ratio: %.2f%%)\n', outPng, statsP45.hotspotCount, statsP45.activatedAreaRatio*100);
end

fprintf('\nAll Phase 4.5 refined comparison figures generated successfully.\n');

end
