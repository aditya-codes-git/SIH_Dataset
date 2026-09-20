function retinalField = segmentRetinalField(imgInput, varargin)
% SEGMENTRETINALFIELD
% Segments the circular/elliptical retinal fundus field from the dark camera background.
% Pure MATLAB implementation (zero external toolbox dependency).
%
% Usage:
%   retinalField = segmentRetinalField(img)
%   retinalField = segmentRetinalField(imgPath)

p = inputParser;
addRequired(p, 'imgInput');
addParameter(p, 'Threshold', 10, @isnumeric); % Intensity threshold out of 255
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

% 1. CONVERT TO LUMINANCE
gray = 0.299 * imgDouble(:,:,1) + 0.587 * imgDouble(:,:,2) + 0.114 * imgDouble(:,:,3);

% 2. THRESHOLD DARK CAMERA BORDER
th = p.Results.Threshold;
rawMask = gray > th;

% Work at standardized scale for fast boundary analysis
scale = max(H, W) / 256.0;
if scale > 1.0
    dsH = max(round(H / scale), 16);
    dsW = max(round(W / scale), 16);
    maskDS = imresize(double(rawMask), [dsH, dsW], 'nearest') > 0.5;
else
    maskDS = rawMask;
    scale = 1.0;
    dsH = H;
    dsW = W;
end

% 3. FIND LARGEST CONNECTED RETINAL COMPONENT (Pure MATLAB BFS)
visited = false(dsH, dsW);
maxCompPts = [];
maxCompCount = 0;

for r = 1:dsH
    for c = 1:dsW
        if maskDS(r, c) && ~visited(r, c)
            % BFS Flood Fill
            q = zeros(dsH * dsW, 2);
            q(1, :) = [r, c];
            visited(r, c) = true;
            head = 1;
            tail = 1;
            
            while head <= tail
                currR = q(head, 1);
                currC = q(head, 2);
                head = head + 1;
                
                for dr = -1:1
                    for dc = -1:1
                        nr = currR + dr;
                        nc = currC + dc;
                        if nr >= 1 && nr <= dsH && nc >= 1 && nc <= dsW
                            if maskDS(nr, nc) && ~visited(nr, nc)
                                visited(nr, nc) = true;
                                tail = tail + 1;
                                q(tail, :) = [nr, nc];
                            end
                        end
                    end
                end
            end
            
            compCount = tail;
            if compCount > maxCompCount
                maxCompCount = compCount;
                maxCompPts = q(1:tail, :);
            end
        end
    end
end

if maxCompCount < (dsH * dsW * 0.05)
    % Failed detection: retinal field smaller than 5% of image
    retinalField = struct(...
        'detected', false, ...
        'centerX', round(W / 2), ...
        'centerY', round(H / 2), ...
        'radiusX', 0, ...
        'radiusY', 0, ...
        'bbox', [1, 1, W, H], ...
        'mask', false(H, W), ...
        'coverageRatio', 0);
    return;
end

% Reconstruct binary mask of largest component at analysis scale
cleanMaskDS = false(dsH, dsW);
for k = 1:maxCompCount
    cleanMaskDS(maxCompPts(k, 1), maxCompPts(k, 2)) = true;
end

% Simple morphological hole filling (scanlines)
cleanMaskDS = fillHolesScanline(cleanMaskDS);

% Scale mask back to original resolution
maskFull = imresize(double(cleanMaskDS), [H, W], 'bilinear') > 0.5;

% 4. COMPUTE RETINAL GEOMETRIC PROPERTIES
[rows, cols] = find(maskFull);
rMin = min(rows); rMax = max(rows);
cMin = min(cols); cMax = max(cols);

centerX = round(mean(cols));
centerY = round(mean(rows));
radiusX = round((cMax - cMin) / 2);
radiusY = round((rMax - rMin) / 2);
bbox = [cMin, rMin, cMax - cMin + 1, rMax - rMin + 1];
coverageRatio = round(length(rows) / (H * W), 4);

retinalField = struct(...
    'detected', true, ...
    'centerX', centerX, ...
    'centerY', centerY, ...
    'radiusX', radiusX, ...
    'radiusY', radiusY, ...
    'bbox', bbox, ...
    'mask', maskFull, ...
    'coverageRatio', coverageRatio);

end

function filled = fillHolesScanline(bw)
% Fills internal holes in binary mask using 1D row & column scanline bounds
[H, W] = size(bw);
filled = bw;
% Fill rows
for r = 1:H
    idx = find(bw(r, :));
    if length(idx) >= 2
        filled(r, idx(1):idx(end)) = true;
    end
end
% Fill cols
for c = 1:W
    idx = find(filled(:, c));
    if length(idx) >= 2
        filled(idx(1):idx(end), c) = true;
    end
end
end
