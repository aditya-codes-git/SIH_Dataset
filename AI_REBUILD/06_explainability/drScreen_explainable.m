function result = drScreen_explainable(imgInput, varargin)
% DRSCREEN_EXPLAINABLE
% Advanced screening inference wrapper uniting:
%   - Image Quality Assessment (IQA) hard gate
%   - Frozen 5-class DR classifier (R18-FINAL-CANDIDATE)
%   - Post-hoc Temperature Scaling probability calibration
%   - Continuous Referable-Risk formulation P(Referable)
%   - Multi-scale high-resolution Grad-CAM on original fundus
%   - Multi-peak attention hotspot extraction and compact bounding boxes
%
% 100% Backward-Compatible: Preserves all legacy fields from drScreen.m.
%
% Usage:
%   result = drScreen_explainable(img)
%   result = drScreen_explainable(imgPath, 'OutputDir', 'output_folder')

p = inputParser;
addRequired(p, 'imgInput');
addParameter(p, 'OutputDir', '', @ischar);
addParameter(p, 'TopK', 6, @isnumeric);
addParameter(p, 'Strategy', 'MultiScaleFusion', @ischar);
parse(p, imgInput, varargin{:});

baseDir = fileparts(fileparts(mfilename('fullpath'))); % AI_REBUILD/
repoDir = fileparts(baseDir);

% 1. RUN CALIBRATED SCREENING
addpath(fullfile(baseDir, '04_calibration'));
calibResult = drScreen_calibrated(imgInput);

% If ungradable, preserve ungradable status and exit early
if strcmp(calibResult.status, "UNGRADABLE")
    result = calibResult;
    result.explainability = struct('available', false, 'reason', 'Image is ungradable');
    result.refinedExplainability = struct('available', false, 'reason', 'Image is ungradable');
    return;
end

result = calibResult;

% 2. RUN MULTI-SCALE GRAD-CAM & MULTI-PEAK HOTSPOT EXTRACTION
addpath(fullfile(baseDir, '06_explainability'));
gradRes = generateImprovedGradCAM(imgInput, ...
    'TargetClass', result.grade, ...
    'Strategy', p.Results.Strategy);
[hotspots, stats] = extractAttentionHotspots(gradRes.heatmap, gradRes.retinalMask, 'TopK', p.Results.TopK);

% 3. EXPORT ARTIFACTS IF OUTPUT DIR SPECIFIED
outDir = p.Results.OutputDir;
if ~isempty(outDir)
    if ~exist(outDir, 'dir'), mkdir(outDir); end
    origPath = fullfile(outDir, 'original_fundus.png');
    heatPath = fullfile(outDir, 'gradcam_heatmap.png');
    overPath = fullfile(outDir, 'gradcam_overlay.png');
    ptsPath = fullfile(outDir, 'attention_points.png');
    
    imwrite(uint8(gradRes.originalImage * 255), origPath);
    imwrite(uint8(gradRes.heatmapRGB * 255), heatPath);
    imwrite(uint8(gradRes.overlayImage * 255), overPath);
    renderAttentionPoints(gradRes.overlayImage, hotspots, 'OutputPath', ptsPath);
else
    origPath = '';
    heatPath = '';
    overPath = '';
    ptsPath = '';
end

% 4. ATTACH ADDITIVE EXPLAINABILITY METADATA (Item 16)
result.explainability = struct(...
    'method', 'Grad-CAM', ...
    'targetClass', result.grade, ...
    'targetLabel', gradRes.targetLabel, ...
    'featureLayer', gradRes.featureLayer, ...
    'sourceResolution', gradRes.sourceResolution, ...
    'heatmapResolution', gradRes.heatmapResolution, ...
    'originalFundusPath', origPath, ...
    'heatmapPath', heatPath, ...
    'overlayPath', overPath, ...
    'attentionPointsPath', ptsPath, ...
    'hotspotCount', stats.hotspotCount, ...
    'attentionPoints', hotspots, ...
    'interpretation', 'Regions with stronger activation contributed more strongly to the model''s predicted class. Hotspots represent model attention and do not independently constitute confirmed microscopic lesion diagnoses.');

% 5. ATTACH REFINED EXPLAINABILITY STRUCT (Item 16)
result.refinedExplainability = struct(...
    'method', 'Multi-Scale Grad-CAM with Multi-Peak NMS', ...
    'featureStrategy', gradRes.strategy, ...
    'featureLayers', gradRes.featureLayers, ...
    'hotspotCount', stats.hotspotCount, ...
    'activatedAreaRatio', stats.activatedAreaRatio, ...
    'meanHotspotStrength', stats.meanHotspotStrength, ...
    'peakHotspotStrength', stats.peakHotspotStrength, ...
    'hotspotDispersion', stats.hotspotDispersion, ...
    'attentionPoints', hotspots);

% Legacy fields explicitly verified intact
result.scoreMap = gradRes.heatmap;
result.processedImage = calibResult.processedImage;

end
