function renderLesionOverlay(img, predMasks, gtMasks, outputDir, imageId)
% RENDERLESIONOVERLAY
% Generates clinical visualizations for retinal lesion segmentation:
%   1. Combined 4-class lesion overlay on the original fundus image
%   2. Class-by-class comparison panels (Fundus, Ground Truth, Prediction, Error Map)
%
% Color coding:
%   MA (Microaneurysms):  Magenta [1.0, 0.0, 1.0]
%   HE (Haemorrhages):    Orange  [1.0, 0.5, 0.0]
%   EX (Hard Exudates):   Yellow  [1.0, 1.0, 0.0]
%   SE (Soft Exudates):   Cyan    [0.0, 0.8, 1.0]
%
% Error Map coding:
%   Green:   True Positive (Agreement)
%   Yellow:  False Positive (Over-segmentation)
%   Red:     False Negative (Missed lesion)

if ~exist(outputDir, 'dir')
    mkdir(outputDir);
end

if ischar(img) || isstring(img)
    img = imread(char(img));
end

if isinteger(img)
    imgDouble = double(img) / 255.0;
else
    imgDouble = double(img);
    if max(imgDouble(:)) > 1.0
        imgDouble = imgDouble / 255.0;
    end
end

[H, W, ~] = size(imgDouble);
hasGt = (nargin >= 3 && ~isempty(gtMasks));

% Define distinct clinical colors
colors = [
    1.0, 0.2, 0.8;  % MA: Vibrant Magenta
    1.0, 0.5, 0.0;  % HE: Orange
    1.0, 1.0, 0.0;  % EX: Yellow
    0.0, 0.8, 1.0   % SE: Cyan
];

classCodes = {'MA', 'HE', 'EX', 'SE'};
classLabels = {'Microaneurysms', 'Haemorrhages', 'Hard Exudates', 'Soft Exudates'};

% -------------------------------------------------------------
% 1. COMBINED MULTI-CLASS OVERLAY ON FUNDUS
% -------------------------------------------------------------
combinedOverlay = imgDouble;
alpha = 0.55;

for c = 1:4
    mask = predMasks(:, :, c);
    if any(mask(:))
        % Dilate slightly for visual saliency of tiny punctate lesions (MA)
        if c == 1
            maskVis = dilateMask(mask, 1);
        else
            maskVis = mask;
        end
        
        cColor = colors(c, :);
        for ch = 1:3
            channel = combinedOverlay(:, :, ch);
            channel(maskVis) = (1 - alpha) * channel(maskVis) + alpha * cColor(ch);
            combinedOverlay(:, :, ch) = channel;
        end
    end
end

combinedPath = fullfile(outputDir, sprintf('%s_combined_overlay.png', imageId));
imwrite(uint8(round(combinedOverlay * 255)), combinedPath);

% -------------------------------------------------------------
% 2. PER-CLASS PANELS (Fundus, GT, Pred, Error Map)
% -------------------------------------------------------------
% To keep rendering fast and file sizes reasonable, resize high-res panels to 768px height
panelH = 768;
scale = panelH / H;
panelW = round(W * scale);

imgDown = imresizePure(imgDouble, panelH, panelW);

for c = 1:4
    clsCode = classCodes{c};
    pMask = predMasks(:, :, c);
    pMaskDown = (imresizePure(double(pMask), panelH, panelW) > 0.3);
    
    if hasGt
        gMask = gtMasks(:, :, c);
        gMaskDown = (imresizePure(double(gMask), panelH, panelW) > 0.3);
    else
        gMaskDown = false(panelH, panelW);
    end
    
    % Panel 1: Original Fundus
    p1 = imgDown;
    
    % Panel 2: Ground Truth overlay
    p2 = imgDown;
    if hasGt && any(gMaskDown(:))
        cColor = colors(c, :);
        for ch = 1:3
            channel = p2(:, :, ch);
            channel(gMaskDown) = (1 - alpha) * channel(gMaskDown) + alpha * cColor(ch);
            p2(:, :, ch) = channel;
        end
    end
    
    % Panel 3: Predicted Mask overlay
    p3 = imgDown;
    if any(pMaskDown(:))
        cColor = colors(c, :);
        for ch = 1:3
            channel = p3(:, :, ch);
            channel(pMaskDown) = (1 - alpha) * channel(pMaskDown) + alpha * cColor(ch);
            p3(:, :, ch) = channel;
        end
    end
    
    % Panel 4: Error map (Green: TP, Yellow: FP, Red: FN)
    p4 = imgDown * 0.4; % Darkened fundus context
    if hasGt
        TP = (pMaskDown & gMaskDown);
        FP = (pMaskDown & ~gMaskDown);
        FN = (~pMaskDown & gMaskDown);
        
        % Green for TP
        p4(:, :, 2) = p4(:, :, 2) + 0.7 * double(TP);
        % Yellow for FP (Red + Green)
        p4(:, :, 1) = p4(:, :, 1) + 0.8 * double(FP);
        p4(:, :, 2) = p4(:, :, 2) + 0.8 * double(FP);
        % Red for FN
        p4(:, :, 1) = p4(:, :, 1) + 0.9 * double(FN);
        
        p4 = min(p4, 1.0);
    end
    
    % Assemble 2x2 comparison grid:
    % [Fundus, Ground Truth; Prediction, Error Map]
    gridImg = [ [p1, p2]; [p3, p4] ];
    
    panelPath = fullfile(outputDir, sprintf('%s_%s_comparison_panel.png', imageId, clsCode));
    imwrite(uint8(round(gridImg * 255)), panelPath);
end

end

function dMask = dilateMask(mask, radius)
% Simple pure-MATLAB morphological dilation for visualization
[H, W] = size(mask);
dMask = mask;
for dr = -radius:radius
    for dc = -radius:radius
        if dr == 0 && dc == 0, continue; end
        r1 = max(1, 1 - dr); r2 = min(H, H - dr);
        c1 = max(1, 1 - dc); c2 = min(W, W - dc);
        dMask(r1:r2, c1:c2) = dMask(r1:r2, c1:c2) | mask((r1:r2) + dr, (c1:c2) + dc);
    end
end
end

function out = imresizePure(in, targetH, targetW)
% Bilinear/nearest pure-MATLAB resize
[inH, inW, nCh] = size(in);
rIdx = min(max(round(linspace(1, inH, targetH)), 1), inH);
cIdx = min(max(round(linspace(1, inW, targetW)), 1), inW);
out = in(rIdx, cIdx, :);
end
