function generateGradcamComparison()
% GENERATEGRADCAMCOMPARISON
% Produces side-by-side comparative visualizations across DR grades:
%   Panel 1: Original High-Resolution Fundus Image
%   Panel 2: Old Production Grad-CAM (224x224, Ben Graham, Jet, 35% Alpha Fog)
%   Panel 3: Improved Grad-CAM (Original Resolution, Perceptual Colormap, Hotspots)
%
% Saves figures to AI_REBUILD/06_explainability/comparisons/

fprintf('===========================================================\n');
fprintf('  GENERATING GRAD-CAM COMPARATIVE VISUALIZATIONS           \n');
fprintf('===========================================================\n');

baseDir = fileparts(fileparts(mfilename('fullpath'))); % AI_REBUILD/
repoDir = fileparts(baseDir);
addpath(fullfile(baseDir, '06_explainability'));
addpath(fullfile(baseDir, '02_training'));
addpath(repoDir); % for preprocessFundusKaggle, drScreen

compDir = fullfile(baseDir, '06_explainability', 'comparisons');
if ~exist(compDir, 'dir'), mkdir(compDir); end

% Representative Test Cases
cases = {
    struct('id', '0125fbd2e791', 'grade', 0, 'desc', 'Grade 0 (No Apparent DR)'), ...
    struct('id', '0684311afdfc', 'grade', 1, 'desc', 'Grade 1 (Mild NPDR)'), ...
    struct('id', '064af6592ba6', 'grade', 2, 'desc', 'Grade 2 (Moderate NPDR)'), ...
    struct('id', '069f43616fab', 'grade', 3, 'desc', 'Grade 3 (Severe NPDR)'), ...
    struct('id', '07122e268a1d', 'grade', 4, 'desc', 'Grade 4 (Proliferative DR)')
};

% Load frozen model and production model
frozenModelFile = fullfile(baseDir, '02_training', 'models', 'trained_dr_model_r18_final_candidate.mat');
prodModelFile = fullfile(repoDir, 'trained_dr_model_preprocessed.mat');

dataFrozen = load(frozenModelFile);
netFrozen = dataFrozen.trainedNet;

dataProd = load(prodModelFile);
netProd = dataProd.trainedNet;

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
    
    % 1. GENERATE OLD PRODUCTION GRAD-CAM
    inputSize = netProd.Layers(1).InputSize(1:2);
    imgP = preprocessFundusKaggle(origImg, inputSize);
    if size(imgP, 3) == 1, imgP = repmat(imgP, 1, 1, 3); end
    [predProd, ~] = classify(netProd, imgP);
    scoreMapProd = gradCAM(netProd, imgP, predProd);
    
    % Render old production overlay (figure with imagesc AlphaData 0.35 + jet)
    figOld = figure('Visible', 'off', 'Position', [100 100 224 224]);
    axOld = axes('Parent', figOld, 'Position', [0 0 1 1]);
    imshow(double(imgP)/255, 'Parent', axOld);
    hold(axOld, 'on');
    imagesc(axOld, scoreMapProd, 'AlphaData', 0.35);
    colormap(axOld, 'jet');
    axis(axOld, 'off');
    hold(axOld, 'off');
    drawnow;
    oldFrame = getframe(axOld);
    oldOverlay = oldFrame.cdata;
    close(figOld);
    
    % 2. GENERATE IMPROVED GRAD-CAM
    impResult = generateImprovedGradCAM(origImg, 'ModelFile', frozenModelFile, 'FeatureLayer', 'res5b_relu');
    hotspots = extractAttentionHotspots(impResult.heatmap, impResult.retinalMask, 'TopK', 4);
    improvedWithHotspots = renderAttentionPoints(impResult.overlayImage, hotspots);
    
    % 3. COMPOSE 3-PANEL COMPARISON FIGURE
    figComp = figure('Visible', 'off', 'Position', [100 100 1400 480]);
    
    % Panel 1: Original High-Res
    subplot(1, 3, 1);
    imshow(origImg);
    title(sprintf('Original Fundus Photo\nResolution: %dx%d', W, H), 'FontSize', 12, 'FontWeight', 'bold');
    
    % Panel 2: Old Production Grad-CAM
    subplot(1, 3, 2);
    imshow(oldOverlay);
    title(sprintf('Old Production Grad-CAM\n224x224 | Jet | 35%% Blue Fog Haze'), 'FontSize', 12, 'FontWeight', 'bold');
    
    % Panel 3: Improved Grad-CAM with Hotspots
    subplot(1, 3, 3);
    imshow(improvedWithHotspots);
    title(sprintf('Improved High-Res Grad-CAM\n%dx%d | Turbo | %d Hotspots (No Haze)', W, H, length(hotspots)), ...
        'FontSize', 12, 'FontWeight', 'bold');
    
    sgtitle(sprintf('RetinoScan AI Explainability Comparison: %s [ID: %s]', caseInfo.desc, caseInfo.id), ...
        'FontSize', 14, 'FontWeight', 'bold');
    
    outPng = fullfile(compDir, sprintf('comparison_grade%d_%s.png', caseInfo.grade, caseInfo.id));
    saveas(figComp, outPng);
    close(figComp);
    fprintf('  Saved: %s\n', outPng);
end

fprintf('\nAll representative comparison figures generated successfully.\n');

end
