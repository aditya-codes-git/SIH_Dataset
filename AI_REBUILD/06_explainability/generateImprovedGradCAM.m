function result = generateImprovedGradCAM(imgInput, varargin)
% GENERATEIMPROVEDGRADCAM
% High-resolution, multi-scale, class-specific Grad-CAM explanation engine for RetinoScan AI.
%
% Refinements (Phase 4.5):
%   1. Multi-Scale Feature Fusion: Combines high-level semantic gating ('res5b_relu', 7x7)
%      with high-resolution spatial localization ('res4b_relu', 14x14):
%        M_fused = sqrt(M_res5b .* M_res4b)
%      eliminating diffuse giant blobs while sharpening focal attention.
%   2. Inverse Spatial Mapping: Maps activations back to ORIGINAL fundus dimensions.
%   3. Dynamic Activation Alpha Mask: Zero blue haze on low activation (alpha = 0).
%   4. Retinal ROI Enforced: Suppresses any border/camera artifacts.
%
% Usage:
%   result = generateImprovedGradCAM(imgPath)
%   result = generateImprovedGradCAM(imgRGB, 'Strategy', 'MultiScaleFusion')

p = inputParser;
addRequired(p, 'imgInput');
addParameter(p, 'ModelFile', fullfile(fileparts(fileparts(mfilename('fullpath'))), '02_training', 'models', 'trained_dr_model_r18_final_candidate.mat'), @ischar);
addParameter(p, 'Strategy', 'MultiScaleFusion', @ischar); % 'MultiScaleFusion', 'res5b_relu', 'res4b_relu'
addParameter(p, 'FeatureLayer', 'res5b_relu', @ischar);
addParameter(p, 'TargetClass', [], @(x) isempty(x) || isnumeric(x) || iscategorical(x));
addParameter(p, 'LowThreshold', 0.20, @isnumeric);
addParameter(p, 'HighThreshold', 0.55, @isnumeric);
addParameter(p, 'MaxAlpha', 0.70, @isnumeric);
addParameter(p, 'ColormapName', 'turbo', @ischar);
parse(p, imgInput, varargin{:});

% 1. LOAD ORIGINAL IMAGE
if ischar(imgInput) || isstring(imgInput)
    origImg = imread(char(imgInput));
else
    origImg = imgInput;
end

if isinteger(origImg)
    origDouble = double(origImg) / 255.0;
else
    origDouble = origImg;
    if max(origDouble(:)) > 1.0
        origDouble = origDouble / 255.0;
    end
end
if size(origDouble, 3) == 1
    origDouble = repmat(origDouble, 1, 1, 3);
end

[H_orig, W_orig, ~] = size(origDouble);

% 2. LOAD FROZEN MODEL
persistent cachedNet cachedModelFile;
if isempty(cachedNet) || ~strcmp(cachedModelFile, p.Results.ModelFile)
    data = load(p.Results.ModelFile);
    cachedNet = data.trainedNet;
    cachedModelFile = p.Results.ModelFile;
end
net = cachedNet;

% 3. PREPROCESSING & TRACKING CROP BOUNDS
inputSize = net.Layers(1).InputSize(1:2);

% Dark border detection (identical to preprocessFundusKaggle)
gray = 0.299 * origDouble(:,:,1) + 0.587 * origDouble(:,:,2) + 0.114 * origDouble(:,:,3);
mask = (gray * 255.0) > 7;

% Create smooth elliptical retinal mask to strictly eliminate corners/borders
[rows, cols] = find(mask);
cropBounds = [1, H_orig, 1, W_orig];
if ~isempty(rows) && ~isempty(cols)
    rMin = min(rows); rMax = max(rows);
    cMin = min(cols); cMax = max(cols);
    if (rMax - rMin >= H_orig * 0.10) && (cMax - cMin >= W_orig * 0.10)
        cropBounds = [rMin, rMax, cMin, cMax];
    end
end

% Ben Graham enhancement on cropped region
croppedImg = origDouble(cropBounds(1):cropBounds(2), cropBounds(3):cropBounds(4), :);
imgPreprocessed = preprocessFundusKaggle(uint8(croppedImg * 255), inputSize);
if size(imgPreprocessed, 3) == 1
    imgPreprocessed = repmat(imgPreprocessed, 1, 1, 3);
end

% 4. PREDICTION & TARGET CLASS RESOLUTION
[predCategorical, scores] = classify(net, imgPreprocessed);
predictedClassNum = double(string(predCategorical));

if isempty(p.Results.TargetClass)
    targetClassCategorical = predCategorical;
    targetClassNum = predictedClassNum;
else
    targetClassNum = double(p.Results.TargetClass);
    targetClassCategorical = categorical(targetClassNum, 0:4);
end

classLabels = {'No DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Proliferative DR'};
targetLabel = classLabels{targetClassNum + 1};

% 5. GRAD-CAM FEATURE EXTRACTION STRATEGY
strategy = p.Results.Strategy;
if strcmpi(strategy, 'MultiScaleFusion')
    % Multi-Scale Fusion: res5b (semantic class gate) + res4b (spatial focus)
    map5b = gradCAM(net, imgPreprocessed, targetClassCategorical, 'FeatureLayer', 'res5b_relu');
    map4b = gradCAM(net, imgPreprocessed, targetClassCategorical, 'FeatureLayer', 'res4b_relu');
    
    map5b = max(map5b, 0);
    map4b = max(map4b, 0);
    
    % Normalize each layer map to [0, 1]
    if max(map5b(:)) > min(map5b(:))
        map5b = (map5b - min(map5b(:))) / (max(map5b(:)) - min(map5b(:)));
    end
    if max(map4b(:)) > min(map4b(:))
        map4b = (map4b - min(map4b(:))) / (max(map4b(:)) - min(map4b(:)));
    end
    
    % Geometric mean product suppresses regions lacking either semantic or spatial support
    fusedMap = sqrt(map5b .* map4b);
    
    % Contrast focalization
    scoreMapCrop = fusedMap .^ 1.2;
    activeFeatureLayers = {'res5b_relu', 'res4b_relu'};
else
    % Single-layer extraction
    layerToUse = p.Results.FeatureLayer;
    rawMap = gradCAM(net, imgPreprocessed, targetClassCategorical, 'FeatureLayer', layerToUse);
    scoreMapCrop = max(rawMap, 0);
    activeFeatureLayers = {layerToUse};
end

% 6. NORMALIZE CROP HEATMAP
minVal = min(scoreMapCrop(:));
maxVal = max(scoreMapCrop(:));
if maxVal > minVal
    normMapCrop = (scoreMapCrop - minVal) / (maxVal - minVal);
else
    normMapCrop = zeros(size(scoreMapCrop));
end

% 7. INVERSE SPATIAL MAPPING TO ORIGINAL HIGH-RESOLUTION CANVAS
cropH = cropBounds(2) - cropBounds(1) + 1;
cropW = cropBounds(4) - cropBounds(3) + 1;
normMapResized = imresize(normMapCrop, [cropH, cropW], 'bilinear');

fullMap = zeros(H_orig, W_orig);
fullMap(cropBounds(1):cropBounds(2), cropBounds(3):cropBounds(4)) = normMapResized;

% Strictly mask by retinal boundary to eliminate non-retinal edge artifacts
fullMap(~mask) = 0;
fullMap = max(min(fullMap, 1.0), 0.0);

% 8. DYNAMIC ACTIVATION-DEPENDENT ALPHA MASK
lowThresh = p.Results.LowThreshold;
highThresh = p.Results.HighThreshold;
maxAlpha = p.Results.MaxAlpha;

alphaMap = zeros(H_orig, W_orig);
rampRegion = (fullMap >= lowThresh) & (fullMap < highThresh);
highRegion = (fullMap >= highThresh);

alphaMap(rampRegion) = maxAlpha * ((fullMap(rampRegion) - lowThresh) / (highThresh - lowThresh)).^1.2;
alphaMap(highRegion) = maxAlpha;
alphaMap(~mask) = 0;

% 9. COLORMAP BLENDING
cmapFunc = str2func(p.Results.ColormapName);
cmap = cmapFunc(256);

colorIdx = min(max(round(fullMap * 255) + 1, 1), 256);
rgbHeatmap = ind2rgb(colorIdx, cmap);

% Alpha blend onto original fundus
alpha3D = repmat(alphaMap, [1, 1, 3]);
overlayRGB = (1 - alpha3D) .* origDouble + alpha3D .* rgbHeatmap;
overlayRGB = max(min(overlayRGB, 1.0), 0.0);

% 10. PACK OUTPUT STRUCTURE
result = struct();
result.originalImage = origDouble;
result.heatmap = fullMap;
result.heatmapRGB = rgbHeatmap;
result.overlayImage = overlayRGB;
result.alphaMask = alphaMap;
result.retinalMask = mask;
result.cropBounds = cropBounds;
result.targetClass = targetClassNum;
result.targetLabel = targetLabel;
result.predictedClass = predictedClassNum;
result.confidence = max(scores);
result.scores = scores;
result.strategy = strategy;
result.featureLayers = activeFeatureLayers;
result.featureLayer = activeFeatureLayers{1};
result.sourceResolution = [H_orig, W_orig];
result.heatmapResolution = [H_orig, W_orig];
result.modelInputResolution = inputSize;

end
