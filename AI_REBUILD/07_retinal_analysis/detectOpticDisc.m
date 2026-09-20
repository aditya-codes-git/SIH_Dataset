function opticDisc = detectOpticDisc(imgInput, varargin)
% DETECTOPTICDISC
% Detects the anatomical Optic Nerve Head (Optic Disc) using classical
% intensity, local contrast, and anatomical shape filtering.
% Pure MATLAB implementation (zero external toolbox dependency).
%
% Output:
%   opticDisc.detected              - boolean
%   opticDisc.centerX               - horizontal pixel coordinate in original image
%   opticDisc.centerY               - vertical pixel coordinate in original image
%   opticDisc.bbox                  - [x, y, w, h] bounding box in original image
%   opticDisc.radius                - estimated radius in pixels
%   opticDisc.algorithmicConfidence - numerical score in [0, 1] (NOT clinical confidence)
%
% Usage:
%   opticDisc = detectOpticDisc(img)
%   opticDisc = detectOpticDisc(img, 'RetinalField', retinalField)

p = inputParser;
addRequired(p, 'imgInput');
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

% 1. OBTAIN RETINAL FIELD
rf = p.Results.RetinalField;
if isempty(rf) || ~isfield(rf, 'mask')
    rf = segmentRetinalField(imgDouble);
end

if ~rf.detected
    opticDisc = emptyOpticDisc();
    return;
end

retinalMask = rf.mask;

% 2. STANDARDIZE SCALE FOR FAST LANDMARK SEARCH (Max dim 256)
scale = max(H, W) / 256.0;
if scale > 1.0
    dsH = max(round(H / scale), 16);
    dsW = max(round(W / scale), 16);
    imgDS = imresize(imgDouble, [dsH, dsW], 'bilinear');
    maskDS = imresize(double(retinalMask), [dsH, dsW], 'nearest') > 0.5;
else
    imgDS = imgDouble;
    maskDS = retinalMask;
    scale = 1.0;
    dsH = H;
    dsW = W;
end

% 3. ERODE RETINAL MASK TO SUPPRESS BRIGHT APERTURE EDGES
erodeDist = max(round(0.08 * min(dsH, dsW)), 5);
innerMask = erodeBinary(maskDS, erodeDist);

% 4. COMPUTE BRIGHTNESS & GRADIENT SALIENCY
% Optic disc is brightest in Red and Green channels
redCh = imgDS(:,:,1);
greenCh = imgDS(:,:,2);
brightMap = 0.5 * redCh + 0.5 * greenCh;

% Local contrast subtraction (highlight compact disc from smooth retinal background)
blurSize = max(round(0.12 * min(dsH, dsW)), 7);
if mod(blurSize, 2) == 0, blurSize = blurSize + 1; end
bgBlur = separableBlur(brightMap, blurSize);
localContrast = (brightMap - bgBlur) .* double(innerMask);
localContrast = max(localContrast, 0);

% 5. CANDIDATE REGION SEARCH (Top 2.5% Brightest Compact Clusters)
validVals = localContrast(innerMask);
if isempty(validVals) || max(validVals) < 5
    opticDisc = emptyOpticDisc();
    return;
end

thVal = prctile(validVals, 97.5);
brightBinary = (localContrast >= thVal) & innerMask;

% 6. CONNECTED COMPONENT ANALYSIS (Pure MATLAB BFS)
visited = false(dsH, dsW);
candidates = [];
expectedRadiusDS = 0.05 * min(dsH, dsW);
minArea = round(pi * (expectedRadiusDS * 0.4)^2);
maxArea = round(pi * (expectedRadiusDS * 2.5)^2);

for r = 1:dsH
    for c = 1:dsW
        if brightBinary(r, c) && ~visited(r, c)
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
                            if brightBinary(nr, nc) && ~visited(nr, nc)
                                visited(nr, nc) = true;
                                tail = tail + 1;
                                q(tail, :) = [nr, nc];
                            end
                        end
                    end
                end
            end
            
            area = tail;
            if area >= minArea && area <= maxArea
                pts = q(1:tail, :);
                cR = mean(pts(:, 1));
                cC = mean(pts(:, 2));
                
                % Check circular compactness (ratio of area to bounding box)
                minR = min(pts(:, 1)); maxR = max(pts(:, 1));
                minC = min(pts(:, 2)); maxC = max(pts(:, 2));
                hBox = maxR - minR + 1;
                wBox = maxC - minC + 1;
                aspect = min(hBox, wBox) / max(hBox, wBox);
                
                % Score candidate by peak contrast, brightness, and aspect ratio
                peakContrast = max(localContrast(sub2ind([dsH, dsW], pts(:,1), pts(:,2))));
                candScore = (peakContrast / 255.0) * 0.6 + aspect * 0.4;
                
                candidates = [candidates; cC, cR, candScore, max(hBox, wBox) / 2]; %#ok<AGROW>
            end
        end
    end
end

% 7. SELECT OPTIMAL CANDIDATE OR MARK UNCERTAIN
if isempty(candidates)
    opticDisc = emptyOpticDisc();
    return;
end

[maxScore, bestIdx] = max(candidates(:, 3));
if maxScore < 0.25
    opticDisc = emptyOpticDisc();
    return;
end

bestC = candidates(bestIdx, 1);
bestR = candidates(bestIdx, 2);
bestRadDS = candidates(bestIdx, 4);

% Scale coordinates back to original high-resolution image
origX = round((bestC - 0.5) * scale + 0.5);
origY = round((bestR - 0.5) * scale + 0.5);
origRad = round(bestRadDS * scale);

% Clamp inside image bounds
origX = max(min(origX, W), 1);
origY = max(min(origY, H), 1);
origRad = max(origRad, 10);

bbox = [max(origX - origRad, 1), max(origY - origRad, 1), ...
        min(2 * origRad, W - max(origX - origRad, 1)), min(2 * origRad, H - max(origY - origRad, 1))];

algorithmicConfidence = round(min(max(maxScore, 0.0), 1.0), 4);

opticDisc = struct(...
    'detected', true, ...
    'centerX', origX, ...
    'centerY', origY, ...
    'bbox', bbox, ...
    'radius', origRad, ...
    'algorithmicConfidence', algorithmicConfidence);

end

function s = emptyOpticDisc()
s = struct(...
    'detected', false, ...
    'centerX', NaN, ...
    'centerY', NaN, ...
    'bbox', [], ...
    'radius', 0, ...
    'algorithmicConfidence', 0.0);
end

function eroded = erodeBinary(bw, dist)
% Pure MATLAB morphological binary erosion using 2D box kernel
[H, W] = size(bw);
kSize = 2 * dist + 1;
% 1D separable horizontal min filter
horiz = bw;
for r = 1:H
    row = bw(r, :);
    for c = 1:W
        c1 = max(c - dist, 1); c2 = min(c + dist, W);
        horiz(r, c) = all(row(c1:c2));
    end
end
% 1D separable vertical min filter
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
% Fast 1D separable box blur
[H, W] = size(img);
r = floor(kSize / 2);
% Horizontal pass
temp = zeros(H, W);
for i = 1:H
    row = img(i, :);
    cum = [0, cumsum(row)];
    for j = 1:W
        j1 = max(j - r, 1); j2 = min(j + r, W);
        temp(i, j) = (cum(j2 + 1) - cum(j1)) / (j2 - j1 + 1);
    end
end
% Vertical pass
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
