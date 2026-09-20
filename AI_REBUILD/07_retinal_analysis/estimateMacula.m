function macula = estimateMacula(imgInput, varargin)
% ESTIMATEMACULA
% Estimates the anatomical position of the Macula / Fovea Centralis using
% relative optic disc geometry and local green-channel hypo-pigmented depression.
% Pure MATLAB implementation (zero external toolbox dependency).
%
% CRITICAL CLINICAL RULE:
% Does NOT place the macula at an arbitrary fixed offset. If a distinct
% local depression within the anatomical search cone cannot be verified,
% returns estimated = false.
%
% Output:
%   macula.estimated             - boolean
%   macula.centerX               - horizontal pixel coordinate in original image
%   macula.centerY               - vertical pixel coordinate in original image
%   macula.radius                - estimated radius in pixels (~0.5 disc radius)
%   macula.algorithmicConfidence - numerical score in [0, 1]
%   macula.method                - descriptive string of estimation approach
%
% Usage:
%   macula = estimateMacula(img, 'OpticDisc', opticDisc, 'RetinalField', retinalField)

p = inputParser;
addRequired(p, 'imgInput');
addParameter(p, 'OpticDisc', [], @(x) isempty(x) || isstruct(x));
addParameter(p, 'RetinalField', [], @(x) isempty(x) || isstruct(x));
parse(p, imgInput, varargin{:});

if ischar(imgInput) || isstring(imgInput)
    img = imread(char(imgInput));
else
    img = imgInput;
end

if isinteger(img)
    imgDouble = double(img);
else
    imgDouble = img;
    if max(imgDouble(:)) <= 1.0
        imgDouble = imgDouble * 255.0;
    end
end
if size(imgDouble, 3) == 1
    imgDouble = repmat(imgDouble, 1, 1, 3);
end

[H, W, ~] = size(imgDouble);

% 1. RETRIEVE RETINAL FIELD AND OPTIC DISC
rf = p.Results.RetinalField;
if isempty(rf) || ~isfield(rf, 'mask')
    rf = segmentRetinalField(imgDouble);
end

if ~rf.detected
    macula = emptyMacula('Retinal field not detected');
    return;
end

od = p.Results.OpticDisc;
if isempty(od) || ~isfield(od, 'detected')
    od = detectOpticDisc(imgDouble, 'RetinalField', rf);
end

% 2. STANDARDIZE SCALE (Max dim 256)
scale = max(H, W) / 256.0;
if scale > 1.0
    dsH = max(round(H / scale), 16);
    dsW = max(round(W / scale), 16);
    greenDS = imresize(imgDouble(:,:,2), [dsH, dsW], 'bilinear');
    maskDS = imresize(double(rf.mask), [dsH, dsW], 'nearest') > 0.5;
else
    greenDS = imgDouble(:,:,2);
    maskDS = rf.mask;
    scale = 1.0;
    dsH = H;
    dsW = W;
end

% Smooth green channel to suppress small vessel noise while keeping macular dip
smoothSize = max(round(0.06 * min(dsH, dsW)), 5);
if mod(smoothSize, 2) == 0, smoothSize = smoothSize + 1; end
smoothGreen = separableBlur(greenDS, smoothSize);

% 3. DEFINE ANATOMICAL SEARCH REGION
retCenterC = rf.centerX / scale;
retCenterR = rf.centerY / scale;
retRadius = min(rf.radiusX, rf.radiusY) / scale;

searchMask = false(dsH, dsW);

if od.detected
    odC = od.centerX / scale;
    odR = od.centerY / scale;
    odRad = od.radius / scale;
    
    % Direction: Temporal is opposite side from the optic disc relative to retinal center
    if odC < retCenterC
        % Disc is on left (nasal for right eye) -> macula is to its right
        temporalDir = +1;
    else
        % Disc is on right (nasal for left eye) -> macula is to its left
        temporalDir = -1;
    end
    
    % Expected distance: 2.0 to 2.8 disc diameters (approx 0.22 - 0.38 of retinal radius)
    minDist = max(odRad * 2.0, retRadius * 0.20);
    maxDist = min(odRad * 3.5, retRadius * 0.45);
    
    % Build elliptical search cone around expected position
    for r = 1:dsH
        for c = 1:dsW
            if maskDS(r, c)
                dHoriz = (c - odC) * temporalDir;
                dVert = abs(r - odR);
                if dHoriz >= minDist && dHoriz <= maxDist && dVert <= (retRadius * 0.15)
                    searchMask(r, c) = true;
                end
            end
        end
    end
    searchMethod = 'Optic Disc Temporal Geometry + Green-Channel Depression';
else
    % Disc not detected: Search central posterior pole region
    for r = 1:dsH
        for c = 1:dsW
            if maskDS(r, c)
                dCenter = sqrt((c - retCenterC)^2 + (r - retCenterR)^2);
                if dCenter <= (retRadius * 0.25)
                    searchMask(r, c) = true;
                end
            end
        end
    end
    searchMethod = 'Central Posterior Pole Search (Optic Disc Unavailable)';
end

if ~any(searchMask(:))
    macula = emptyMacula('Search cone outside retinal field');
    return;
end

% 4. SEARCH FOR LOCAL MINIMUM DEPRESSION (Dark Foveal Center)
valsInSearch = smoothGreen(searchMask);
minVal = min(valsInSearch);
meanVal = mean(valsInSearch);

% The fovea must be darker than the local surrounding retina
contrastDepth = meanVal - minVal;
if contrastDepth < 4.0 % Ambiguous contrast
    macula = emptyMacula('Macular contrast depth insufficient (< 4.0)');
    return;
end

[minRows, minCols] = find(smoothGreen == minVal & searchMask);
bestR = mean(minRows);
bestC = mean(minCols);

% 5. SCALE COORDINATES BACK TO ORIGINAL IMAGE
origX = round((bestC - 0.5) * scale + 0.5);
origY = round((bestR - 0.5) * scale + 0.5);
origX = max(min(origX, W), 1);
origY = max(min(origY, H), 1);

if od.detected
    maculaRad = round(od.radius * 0.5);
else
    maculaRad = round(0.03 * min(H, W));
end
maculaRad = max(maculaRad, 8);

conf = min(max(contrastDepth / 25.0, 0.20), 0.90);
if od.detected, conf = min(conf + 0.10, 0.95); end

macula = struct(...
    'estimated', true, ...
    'centerX', origX, ...
    'centerY', origY, ...
    'radius', maculaRad, ...
    'algorithmicConfidence', round(conf, 4), ...
    'method', searchMethod);

end

function s = emptyMacula(reason)
s = struct(...
    'estimated', false, ...
    'centerX', NaN, ...
    'centerY', NaN, ...
    'radius', 0, ...
    'algorithmicConfidence', 0.0, ...
    'method', sprintf('Unavailable: %s', reason));
end

function blurred = separableBlur(img, kSize)
[H, W] = size(img);
r = floor(kSize / 2);
temp = zeros(H, W);
for i = 1:H
    row = img(i, :);
    cum = [0, cumsum(row)];
    for j = 1:W
        j1 = max(j - r, 1); j2 = min(j + r, W);
        temp(i, j) = (cum(j2 + 1) - cum(j1)) / (j2 - j1 + 1);
    end
end
blurred = zeros(H, W);
for j = 1:W
    col = temp(:, j);
    cum = [0; cumsum(col)];
    for i = 1:H
        i1 = max(i - r, 1); i2 = min(i + r, H);
        blurred(i, j) = (cum(i2 + 1) - cum(i1)) / (i2 - i1 + 1);
    end
end
end
