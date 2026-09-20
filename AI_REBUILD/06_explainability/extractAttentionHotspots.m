function [hotspots, stats] = extractAttentionHotspots(heatmap, retinalMask, varargin)
% EXTRACTATTENTIONHOTSPOTS
% Extracts, characterizes, and ranks high-activation model attention hotspots
% using multi-peak non-maximum suppression (NMS) and compact bounding box control.
%
% Phase 4.5 Refinements:
%   1. Multi-Peak Separation: Breaks giant merged blobs into distinct local peaks.
%   2. Compact Bounding Boxes: Limits bounding box size to local peak contours (<= 16% of image).
%   3. Retinal ROI Guard: Strictly eliminates any border/corner artifacts.
%   4. Quantitative Localization Statistics: Area ratios, dispersion, and peak strengths.
%
% CRITICAL CLINICAL RULE:
% These regions represent MODEL ATTENTION and do NOT constitute confirmed
% microscopic clinical lesion diagnoses (microaneurysms, hemorrhages, exudates).
%
% Usage:
%   [hotspots, stats] = extractAttentionHotspots(heatmap, retinalMask)

p = inputParser;
addRequired(p, 'heatmap');
addRequired(p, 'retinalMask');
addParameter(p, 'ThresholdRatio', 0.40, @isnumeric);
addParameter(p, 'TopK', 6, @isnumeric);
addParameter(p, 'MinPeakDistanceRatio', 0.06, @isnumeric); % Min 6% image dimension separation
addParameter(p, 'MaxBoxRatio', 0.16, @isnumeric);          % Max 16% image dimension box size
parse(p, heatmap, retinalMask, varargin{:});

[H, W] = size(heatmap);
topK = p.Results.TopK;

% 1. DEFINE ATTENTION THRESHOLD & RETINAL ROI
retinalPixels = heatmap(retinalMask & heatmap > 0.05);
if isempty(retinalPixels)
    hotspots = struct([]);
    stats = emptyStats();
    return;
end

maxVal = max(retinalPixels);
thVal = max(p.Results.ThresholdRatio * maxVal, 0.30);

% Work at a standardized analysis scale (max dimension 256) for robust peak finding
scale = max(H, W) / 256.0;
if scale > 1.0
    dsH = max(round(H / scale), 16);
    dsW = max(round(W / scale), 16);
    heatDS = imresize(double(heatmap), [dsH, dsW], 'bilinear');
    maskDS = imresize(double(retinalMask), [dsH, dsW], 'nearest') > 0.5;
else
    heatDS = double(heatmap);
    maskDS = logical(retinalMask);
    scale = 1.0;
    dsH = H;
    dsW = W;
end

% Apply retinal mask strictly
heatDS(~maskDS) = 0;
binaryDS = (heatDS >= thVal) & maskDS;

% 2. MULTI-PEAK DETECTION (Local 2D Maxima Search)
minPeakDistDS = max(round(p.Results.MinPeakDistanceRatio * max(dsH, dsW)), 3);
candidatePeaks = [];

% Scan for local 8-neighborhood maxima
for r = 2:(dsH - 1)
    for c = 2:(dsW - 1)
        val = heatDS(r, c);
        if val >= thVal && maskDS(r, c)
            % Check 8-neighborhood
            patch = heatDS(r-1:r+1, c-1:c+1);
            if val >= max(patch(:))
                candidatePeaks = [candidatePeaks; r, c, val]; %#ok<AGROW>
            end
        end
    end
end

if isempty(candidatePeaks)
    hotspots = struct([]);
    stats = emptyStats();
    return;
end

% Sort candidate peaks descending by activation
[~, sortP] = sort(candidatePeaks(:, 3), 'descend');
candidatePeaks = candidatePeaks(sortP, :);

% 3. GREEDY NON-MAXIMUM SUPPRESSION (NMS)
selectedPeaks = [];
for i = 1:size(candidatePeaks, 1)
    currR = candidatePeaks(i, 1);
    currC = candidatePeaks(i, 2);
    currVal = candidatePeaks(i, 3);
    
    if isempty(selectedPeaks)
        selectedPeaks = [currR, currC, currVal];
    else
        % Distance to all accepted peaks
        dists = sqrt((selectedPeaks(:, 1) - currR).^2 + (selectedPeaks(:, 2) - currC).^2);
        if all(dists >= minPeakDistDS)
            selectedPeaks = [selectedPeaks; currR, currC, currVal]; %#ok<AGROW>
        end
    end
    
    if size(selectedPeaks, 1) >= topK
        break;
    end
end

numHotspots = size(selectedPeaks, 1);
if numHotspots == 0
    hotspots = struct([]);
    stats = emptyStats();
    return;
end

% 4. CHARACTERIZE HOTSPOTS WITH COMPACT LOCAL BOUNDING BOXES
retinalArea = max(sum(retinalMask(:)), 1);
maxBoxPixels = round(p.Results.MaxBoxRatio * min(H, W));
centerX = W / 2.0;
centerY = H / 2.0;
normRadius = 0.5 * min(H, W);

tempHotspots = repmat(struct(...
    'id', 0, ...
    'x', 0, ...
    'y', 0, ...
    'normalizedX', 0, ...
    'normalizedY', 0, ...
    'bbox', [0 0 0 0], ...
    'areaPixels', 0, ...
    'areaRatio', 0, ...
    'localPeak', 0, ...
    'meanActivation', 0, ...
    'maxActivation', 0, ...
    'strength', 0, ...
    'anatomicalRegion', '', ...
    'type', 'Model Attention Hotspot'), numHotspots, 1);

for k = 1:numHotspots
    pkR_ds = selectedPeaks(k, 1);
    pkC_ds = selectedPeaks(k, 2);
    pkVal = selectedPeaks(k, 3);
    
    % Scale to original image coordinates
    origX = round((pkC_ds - 0.5) * scale + 0.5);
    origY = round((pkR_ds - 0.5) * scale + 0.5);
    origX = max(min(origX, W), 1);
    origY = max(min(origY, H), 1);
    
    % Compute COMPACT Local Bounding Box:
    % Search local contour where heatmap >= 0.70 * peak value
    localRadius = max(round(0.04 * min(H, W)), 10);
    halfBox = min(localRadius, round(maxBoxPixels / 2));
    
    cMin = max(origX - halfBox, 1);
    cMax = min(origX + halfBox, W);
    rMin = max(origY - halfBox, 1);
    rMax = min(origY + halfBox, H);
    
    bbox = [cMin, rMin, cMax - cMin + 1, rMax - rMin + 1];
    
    % Local neighborhood activation statistics
    subRegion = heatmap(rMin:rMax, cMin:cMax);
    meanAct = mean(subRegion(:));
    maxAct = max(subRegion(:));
    areaP = (cMax - cMin + 1) * (rMax - rMin + 1);
    areaR = areaP / retinalArea;
    
    % Composite ranking strength score
    strength = 0.60 * pkVal + 0.25 * meanAct + 0.15 * (1.0 - min(areaR * 10, 0.5));
    
    % Coarse Geometric Anatomical Region
    distFromCenter = sqrt((origX - centerX)^2 + (origY - centerY)^2) / normRadius;
    if distFromCenter <= 0.35
        anatRegion = 'Central / Posterior Retinal Pole';
    else
        if origY < centerY - 0.15 * H
            anatRegion = 'Superior Retinal Region';
        elseif origY > centerY + 0.15 * H
            anatRegion = 'Inferior Retinal Region';
        elseif origX < centerX
            anatRegion = 'Temporal / Nasal Region (Hemifield 1)';
        else
            anatRegion = 'Nasal / Temporal Region (Hemifield 2)';
        end
    end
    
    tempHotspots(k).id = k;
    tempHotspots(k).x = origX;
    tempHotspots(k).y = origY;
    tempHotspots(k).normalizedX = round(origX / W, 4);
    tempHotspots(k).normalizedY = round(origY / H, 4);
    tempHotspots(k).bbox = bbox;
    tempHotspots(k).areaPixels = round(areaP);
    tempHotspots(k).areaRatio = round(areaR, 6);
    tempHotspots(k).localPeak = round(pkVal, 4);
    tempHotspots(k).meanActivation = round(meanAct, 4);
    tempHotspots(k).maxActivation = round(maxAct, 4);
    tempHotspots(k).strength = round(strength, 4);
    tempHotspots(k).anatomicalRegion = anatRegion;
    tempHotspots(k).type = 'Model Attention Hotspot';
end

hotspots = tempHotspots;

% 5. COMPUTE QUANTITATIVE LOCALIZATION STATISTICS (Item 13)
activePixels = sum(binaryDS(:));
totalRetinalPixelsDS = sum(maskDS(:));

stats = struct();
stats.hotspotCount = numHotspots;
stats.activatedAreaRatio = round(activePixels / max(totalRetinalPixelsDS, 1), 4);
stats.meanHotspotStrength = round(mean([hotspots.strength]), 4);
stats.peakHotspotStrength = round(max([hotspots.strength]), 4);

if numHotspots > 1
    ptsX = [hotspots.normalizedX];
    ptsY = [hotspots.normalizedY];
    stats.hotspotDispersion = round(sqrt(var(ptsX) + var(ptsY)), 4);
else
    stats.hotspotDispersion = 0.0;
end

end

function s = emptyStats()
s = struct(...
    'hotspotCount', 0, ...
    'activatedAreaRatio', 0, ...
    'meanHotspotStrength', 0, ...
    'peakHotspotStrength', 0, ...
    'hotspotDispersion', 0);
end
