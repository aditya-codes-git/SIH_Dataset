function vessels = analyzeRetinalVessels(imgInput, varargin)
% ANALYZERETINALVESSELS
% Classical image-processing extraction of retinal blood vessel architecture.
% Pure MATLAB implementation (zero external toolbox dependency).
%
% CRITICAL CLINICAL RULE:
% Does NOT claim to be a deep-learning validated vessel segmentation model.
% If contrast or image quality is insufficient, marks available = false.
%
% Output:
%   vessels.available       - boolean
%   vessels.maskPath        - file path to saved vessel mask (if output specified)
%   vessels.vesselAreaRatio - ratio of vessel pixels to total retinal area
%   vessels.branchDensity   - estimated vessel tree density metric
%   vessels.method          - methodology description
%
% Usage:
%   vessels = analyzeRetinalVessels(img)
%   vessels = analyzeRetinalVessels(img, 'OutputPath', 'vessels.png')

p = inputParser;
addRequired(p, 'imgInput');
addParameter(p, 'RetinalField', [], @(x) isempty(x) || isstruct(x));
addParameter(p, 'OutputPath', '', @ischar);
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

% 1. RETRIEVE RETINAL FIELD
rf = p.Results.RetinalField;
if isempty(rf) || ~isfield(rf, 'mask')
    rf = segmentRetinalField(imgDouble);
end

if ~rf.detected
    vessels = emptyVessels('Retinal field not detected');
    return;
end

retinalMask = rf.mask;

% 2. STANDARDIZE SCALE (Max dim 512 for good vessel detail)
scale = max(H, W) / 512.0;
if scale > 1.0
    dsH = max(round(H / scale), 32);
    dsW = max(round(W / scale), 32);
    greenDS = imresize(imgDouble(:,:,2), [dsH, dsW], 'bilinear');
    maskDS = imresize(double(retinalMask), [dsH, dsW], 'nearest') > 0.5;
else
    greenDS = imgDouble(:,:,2);
    maskDS = retinalMask;
    scale = 1.0;
    dsH = H;
    dsW = W;
end

% Erode mask slightly to avoid boundary false positives
erodeDist = max(round(0.03 * min(dsH, dsW)), 3);
innerMask = erodeBinary(maskDS, erodeDist);

% 3. INVERTED GREEN CHANNEL CONTRAST ENHANCEMENT
invGreen = (255.0 - greenDS) .* double(innerMask);

% Subtract local background illumination
blurSize = max(round(0.06 * min(dsH, dsW)), 9);
if mod(blurSize, 2) == 0, blurSize = blurSize + 1; end
bgBlur = separableBlur(invGreen, blurSize);

vesselSaliency = (invGreen - bgBlur) .* double(innerMask);
vesselSaliency = max(vesselSaliency, 0);

% 4. ADAPTIVE THRESHOLDING
validVals = vesselSaliency(innerMask);
if isempty(validVals) || max(validVals) < 5
    vessels = emptyVessels('Low green-channel vessel contrast');
    return;
end

% Upper 10% of saliency values represent primary and secondary vessel branches
thVal = prctile(validVals, 90.0);
rawVesselsDS = (vesselSaliency >= thVal) & innerMask;

% 5. NOISE SUPPRESSION (Discard tiny isolated components < 8 pixels)
cleanVesselsDS = filterSmallComponents(rawVesselsDS, 8);

% 6. QUALITY EVALUATION
retinalAreaDS = max(sum(maskDS(:)), 1);
vesselAreaDS = sum(cleanVesselsDS(:));
vesselAreaRatio = vesselAreaDS / retinalAreaDS;

% Plausible retinal vessel coverage is between 4% and 22%
if vesselAreaRatio < 0.03 || vesselAreaRatio > 0.25
    vessels = emptyVessels(sprintf('Vessel coverage ratio (%.1f%%) outside anatomical range [3%% - 25%%]', vesselAreaRatio*100));
    return;
end

% Scale vessel mask to original dimensions
vesselMaskFull = imresize(double(cleanVesselsDS), [H, W], 'bilinear') > 0.5;
vesselMaskFull(~retinalMask) = false;

% Save mask if output path requested
outPath = p.Results.OutputPath;
if ~isempty(outPath)
    [outDir, ~, ~] = fileparts(outPath);
    if ~isempty(outDir) && ~exist(outDir, 'dir'), mkdir(outDir); end
    imwrite(uint8(vesselMaskFull * 255), outPath);
end

% Branch density: surface area of vessel edges
edgeCount = sum(sum(abs(diff(cleanVesselsDS, 1, 1)))) + sum(sum(abs(diff(cleanVesselsDS, 1, 2))));
branchDensity = round(edgeCount / retinalAreaDS, 4);

vessels = struct(...
    'available', true, ...
    'maskPath', outPath, ...
    'vesselAreaRatio', round(vesselAreaRatio, 4), ...
    'branchDensity', branchDensity, ...
    'method', 'Green-Channel Inverted Background Subtraction (Classical Processing)');

end

function s = emptyVessels(reason)
s = struct(...
    'available', false, ...
    'maskPath', '', ...
    'vesselAreaRatio', 0.0, ...
    'branchDensity', 0.0, ...
    'method', sprintf('Unavailable: %s', reason));
end

function clean = filterSmallComponents(bw, minPixels)
[H, W] = size(bw);
visited = false(H, W);
clean = false(H, W);

for r = 1:H
    for c = 1:W
        if bw(r, c) && ~visited(r, c)
            q = zeros(H * W, 2);
            q(1, :) = [r, c];
            visited(r, c) = true;
            head = 1; tail = 1;
            while head <= tail
                currR = q(head, 1); currC = q(head, 2); head = head + 1;
                for dr = -1:1
                    for dc = -1:1
                        nr = currR + dr; nc = currC + dc;
                        if nr >= 1 && nr <= H && nc >= 1 && nc <= W
                            if bw(nr, nc) && ~visited(nr, nc)
                                visited(nr, nc) = true;
                                tail = tail + 1;
                                q(tail, :) = [nr, nc];
                            end
                        end
                    end
                end
            end
            if tail >= minPixels
                for k = 1:tail
                    clean(q(k, 1), q(k, 2)) = true;
                end
            end
        end
    end
end
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
