function findings = extractCandidateFindings(imgInput, varargin)
% EXTRACTCANDIDATEFINDINGS
% Unsupervised morphological extraction of candidate retinal abnormalities.
% Pure MATLAB implementation (zero external toolbox dependency).
%
% STRICT CLINICAL GOVERNANCE RULE:
% APTOS provides image-level DR grades, NOT lesion-level masks or bounding boxes.
% These regions are strictly labeled as "Candidate Findings", NOT confirmed
% microaneurysms, hemorrhages, or exudates.
%
% Output struct array:
%   findings(k).id           - integer identifier 1..N
%   findings(k).type         - 'candidate_dark_region', 'candidate_bright_region', 'candidate_red_region'
%   findings(k).label        - descriptive clinical terminology
%   findings(k).centerX      - pixel x coordinate on original image
%   findings(k).centerY      - pixel y coordinate on original image
%   findings(k).normalizedX  - x / W in [0, 1]
%   findings(k).normalizedY  - y / H in [0, 1]
%   findings(k).bbox         - [x, y, w, h]
%   findings(k).area         - area in pixels
%   findings(k).score        - saliency score in [0, 1]
%   findings(k).source       - 'morphological_candidate_analysis'
%   findings(k).status       - 'candidate'
%
% Usage:
%   findings = extractCandidateFindings(img)

p = inputParser;
addRequired(p, 'imgInput');
addParameter(p, 'RetinalField', [], @(x) isempty(x) || isstruct(x));
addParameter(p, 'OpticDisc', [], @(x) isempty(x) || isstruct(x));
addParameter(p, 'Vessels', [], @(x) isempty(x) || isstruct(x));
addParameter(p, 'MaxFindings', 12, @isnumeric);
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

% 1. RETRIEVE ANATOMICAL CONTEXT
rf = p.Results.RetinalField;
if isempty(rf) || ~isfield(rf, 'mask'), rf = segmentRetinalField(imgDouble); end
if ~rf.detected
    findings = repmat(emptyFinding(), 0, 1);
    return;
end

od = p.Results.OpticDisc;
if isempty(od) || ~isfield(od, 'detected'), od = detectOpticDisc(imgDouble, 'RetinalField', rf); end

vessels = p.Results.Vessels;
if isempty(vessels) || ~isfield(vessels, 'available'), vessels = analyzeRetinalVessels(imgDouble, 'RetinalField', rf); end

% 2. STANDARDIZE SCALE (Max dim 512 for fine lesion detection)
scale = max(H, W) / 512.0;
if scale > 1.0
    dsH = max(round(H / scale), 32);
    dsW = max(round(W / scale), 32);
    imgDS = imresize(imgDouble, [dsH, dsW], 'bilinear');
    retinalMaskDS = imresize(double(rf.mask), [dsH, dsW], 'nearest') > 0.5;
else
    imgDS = imgDouble;
    retinalMaskDS = rf.mask;
    scale = 1.0;
    dsH = H;
    dsW = W;
end

% 3. CONSTRUCT ANATOMICAL EXCLUSION MASK
% Erode retinal boundary to avoid edge artifacts
erodeDist = max(round(0.04 * min(dsH, dsW)), 3);
searchROI = erodeBinary(retinalMaskDS, erodeDist);

% Exclude Optic Disc region (physiological bright cup)
if od.detected
    odX_ds = od.centerX / scale;
    odY_ds = od.centerY / scale;
    odR_ds = (od.radius / scale) * 1.3;
    [gridC, gridR] = meshgrid(1:dsW, 1:dsH);
    discDist = sqrt((gridC - odX_ds).^2 + (gridR - odY_ds).^2);
    searchROI = searchROI & (discDist > odR_ds);
end

redCh = imgDS(:,:,1);
greenCh = imgDS(:,:,2);
blueCh = imgDS(:,:,3);

% Local background smoothing
blurSize = max(round(0.05 * min(dsH, dsW)), 7);
if mod(blurSize, 2) == 0, blurSize = blurSize + 1; end
greenBg = separableBlur(greenCh, blurSize);
redBg = separableBlur(redCh, blurSize);

rawFindings = [];

% 4. CATEGORY 1: CANDIDATE BRIGHT REGIONS (Focal yellow/white spots)
brightDiff = (greenCh - greenBg) .* double(searchROI);
brightDiff = max(brightDiff, 0);
validBright = brightDiff(searchROI);
if ~isempty(validBright) && max(validBright) > 12
    thBright = max(prctile(validBright, 98.5), 14);
    brightMask = (brightDiff >= thBright) & searchROI;
    % Extract connected bright regions
    brightCands = extractConnectedCandidates(brightMask, brightDiff, ...
        'candidate_bright_region', 'Candidate bright retinal region', ...
        scale, H, W, dsH, dsW);
    rawFindings = [rawFindings; brightCands];
end

% 5. CATEGORY 2: CANDIDATE DARK REGIONS (Focal dark/red spots)
darkDiff = (greenBg - greenCh) .* double(searchROI);
darkDiff = max(darkDiff, 0);
validDark = darkDiff(searchROI);
if ~isempty(validDark) && max(validDark) > 12
    thDark = max(prctile(validDark, 98.5), 14);
    darkMask = (darkDiff >= thDark) & searchROI;
    darkCands = extractConnectedCandidates(darkMask, darkDiff, ...
        'candidate_dark_region', 'Candidate dark retinal region', ...
        scale, H, W, dsH, dsW);
    rawFindings = [rawFindings; darkCands];
end

% 6. CATEGORY 3: CANDIDATE RED REGIONS (Larger dark-red patches)
redSalience = (redCh - 1.25 * greenCh) .* double(searchROI);
redSalience = max(redSalience, 0);
validRed = redSalience(searchROI);
if ~isempty(validRed) && max(validRed) > 15
    thRed = max(prctile(validRed, 98.0), 18);
    redMask = (redSalience >= thRed) & searchROI;
    redCands = extractConnectedCandidates(redMask, redSalience, ...
        'candidate_red_region', 'Candidate red lesion-like region', ...
        scale, H, W, dsH, dsW);
    rawFindings = [rawFindings; redCands];
end

if isempty(rawFindings)
    findings = repmat(emptyFinding(), 0, 1);
    return;
end

% 7. RANK AND SELECT TOP FINDINGS
[~, sortIdx] = sort([rawFindings.score], 'descend');
maxFindings = p.Results.MaxFindings;
numToKeep = min(maxFindings, length(sortIdx));

findings = rawFindings(sortIdx(1:numToKeep));

% Re-index sequential IDs 1..K
for k = 1:numToKeep
    findings(k).id = k;
end

end

function cands = extractConnectedCandidates(bw, saliencyMap, typeName, labelName, scale, H, W, dsH, dsW)
cands = [];
visited = false(dsH, dsW);

minPixels = 4;
maxPixels = round(dsH * dsW * 0.04); % Max 4% of image to avoid giant blobs

for r = 1:dsH
    for c = 1:dsW
        if bw(r, c) && ~visited(r, c)
            q = zeros(dsH * dsW, 2);
            q(1, :) = [r, c];
            visited(r, c) = true;
            head = 1; tail = 1;
            while head <= tail
                currR = q(head, 1); currC = q(head, 2); head = head + 1;
                for dr = -1:1
                    for dc = -1:1
                        nr = currR + dr; nc = currC + dc;
                        if nr >= 1 && nr <= dsH && nc >= 1 && nc <= dsW
                            if bw(nr, nc) && ~visited(nr, nc)
                                visited(nr, nc) = true;
                                tail = tail + 1;
                                q(tail, :) = [nr, nc];
                            end
                        end
                    end
                end
            end
            
            compSize = tail;
            if compSize >= minPixels && compSize <= maxPixels
                pts = q(1:tail, :);
                cR = mean(pts(:, 1));
                cC = mean(pts(:, 2));
                
                minR = min(pts(:, 1)); maxR = max(pts(:, 1));
                minC = min(pts(:, 2)); maxC = max(pts(:, 2));
                
                origX = round((cC - 0.5) * scale + 0.5);
                origY = round((cR - 0.5) * scale + 0.5);
                origX = max(min(origX, W), 1);
                origY = max(min(origY, H), 1);
                
                origMinX = max(round((minC - 0.5) * scale + 0.5), 1);
                origMaxX = min(round((maxC - 0.5) * scale + 0.5), W);
                origMinY = max(round((minR - 0.5) * scale + 0.5), 1);
                origMaxY = min(round((maxR - 0.5) * scale + 0.5), H);
                
                bbox = [origMinX, origMinY, origMaxX - origMinX + 1, origMaxY - origMinY + 1];
                
                % Saliency score
                salVals = zeros(compSize, 1);
                for k = 1:compSize
                    salVals(k) = saliencyMap(pts(k, 1), pts(k, 2));
                end
                score = min(max(max(salVals) / 80.0, 0.20), 0.95);
                areaPixels = round(compSize * (scale^2));
                
                item = struct();
                item.id = 0;
                item.type = typeName;
                item.label = labelName;
                item.centerX = origX;
                item.centerY = origY;
                item.normalizedX = round(origX / W, 4);
                item.normalizedY = round(origY / H, 4);
                item.bbox = bbox;
                item.area = areaPixels;
                item.score = round(score, 4);
                item.source = 'morphological_candidate_analysis';
                item.status = 'candidate';
                
                cands = [cands; item]; %#ok<AGROW>
            end
        end
    end
end
end

function s = emptyFinding()
s = struct(...
    'id', 0, ...
    'type', '', ...
    'label', '', ...
    'centerX', NaN, ...
    'centerY', NaN, ...
    'normalizedX', 0, ...
    'normalizedY', 0, ...
    'bbox', [], ...
    'area', 0, ...
    'score', 0, ...
    'source', 'morphological_candidate_analysis', ...
    'status', 'unavailable');
end

function eroded = erodeBinary(bw, dist)
[H, W] = size(bw);
horiz = bw;
for r = 1:H
    row = bw(r, :);
    for c = 1:W
        c1 = max(c - dist, 1); c2 = min(c + dist, W);
        horiz(r, c) = all(row(c1:c2));
    end
end
eroded = horiz;
for c = 1:W
    col = horiz(:, c);
    for r = 1:H
        r1 = max(r - dist, 1); r2 = min(r + dist, H);
        eroded(r, c) = all(col(r1:r2));
    end
end
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
