function explainPkg = generateFullExplainabilityPackage(imgInput, outDir, varargin)
% GENERATEFULLEXPLAINABILITYPACKAGE
% Generates the complete 4-asset explainability package, refined attention hotspots,
% and structured JSON metadata (Phase 4.5 Refined Engine):
%   1. original_fundus.png
%   2. gradcam_heatmap.png
%   3. gradcam_overlay.png
%   4. attention_points.png
%   5. explanation_metadata.json
%
% Usage:
%   explainPkg = generateFullExplainabilityPackage(imgPath, outDir)

p = inputParser;
addRequired(p, 'imgInput');
addRequired(p, 'outDir');
addParameter(p, 'TopK', 6, @isnumeric);
addParameter(p, 'Strategy', 'MultiScaleFusion', @ischar);
addParameter(p, 'ModelFile', fullfile(fileparts(fileparts(mfilename('fullpath'))), '02_training', 'models', 'trained_dr_model_r18_final_candidate.mat'), @ischar);
addParameter(p, 'Prefix', '', @ischar);
parse(p, imgInput, outDir, varargin{:});

if ~exist(outDir, 'dir')
    mkdir(outDir);
end

prefix = p.Results.Prefix;
if ~isempty(prefix) && ~endsWith(prefix, '_')
    prefix = [prefix, '_'];
end

% 1. RUN MULTI-SCALE GRAD-CAM
gradResult = generateImprovedGradCAM(imgInput, ...
    'ModelFile', p.Results.ModelFile, ...
    'Strategy', p.Results.Strategy);

% 2. EXTRACT MULTI-PEAK ATTENTION HOTSPOTS & DESCRIPTIVE STATS
[hotspots, stats] = extractAttentionHotspots(gradResult.heatmap, gradResult.retinalMask, 'TopK', p.Results.TopK);

% 3. EXPORT SEPARATE ASSETS
% A. Original Fundus
origPath = fullfile(outDir, sprintf('%soriginal_fundus.png', prefix));
imwrite(uint8(gradResult.originalImage * 255), origPath);

% B. Raw Grad-CAM Heatmap
heatmapPath = fullfile(outDir, sprintf('%sgradcam_heatmap.png', prefix));
imwrite(uint8(gradResult.heatmapRGB * 255), heatmapPath);

% C. Clean Grad-CAM Overlay (No Blue Fog)
overlayPath = fullfile(outDir, sprintf('%sgradcam_overlay.png', prefix));
imwrite(uint8(gradResult.overlayImage * 255), overlayPath);

% D. Numbered Hotspot Visualization with Compact Boxes
pointsPath = fullfile(outDir, sprintf('%sattention_points.png', prefix));
renderAttentionPoints(gradResult.overlayImage, hotspots, 'OutputPath', pointsPath);

% 4. COMPILE STRUCTURED EXPLANATION METADATA (Item 15 & 16)
meta = struct();
meta.method = 'Multi-Scale Grad-CAM with Multi-Peak NMS';
meta.featureStrategy = gradResult.strategy;
meta.featureLayers = gradResult.featureLayers;
meta.targetClass = gradResult.targetClass;
meta.targetLabel = gradResult.targetLabel;
meta.predictedClass = gradResult.predictedClass;
meta.confidence = round(gradResult.confidence, 4);
meta.heatmapResolution = sprintf('%dx%d', gradResult.heatmapResolution(1), gradResult.heatmapResolution(2));
meta.sourceResolution = sprintf('%dx%d', gradResult.sourceResolution(1), gradResult.sourceResolution(2));
meta.hotspotCount = stats.hotspotCount;
meta.activatedAreaRatio = stats.activatedAreaRatio;
meta.meanHotspotStrength = stats.meanHotspotStrength;
meta.peakHotspotStrength = stats.peakHotspotStrength;
meta.hotspotDispersion = stats.hotspotDispersion;
meta.attentionPoints = hotspots;
meta.interpretation = 'Regions with stronger activation contributed more strongly to the model''s predicted diabetic retinopathy grade. These regions represent model visual attention and do not independently constitute confirmed microscopic lesion diagnoses.';
meta.assets = struct(...
    'originalFundus', origPath, ...
    'gradcamHeatmap', heatmapPath, ...
    'gradcamOverlay', overlayPath, ...
    'attentionPoints', pointsPath);

jsonPath = fullfile(outDir, sprintf('%sexplanation_metadata.json', prefix));
fid = fopen(jsonPath, 'w');
fprintf(fid, '%s', jsonencode(meta));
fclose(fid);

explainPkg = meta;
explainPkg.metadataFile = jsonPath;

end
