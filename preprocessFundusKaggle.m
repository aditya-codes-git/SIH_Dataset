function enhancedImg = preprocessFundusKaggle(img, targetSize)
% PREPROCESSFUNDUSKAGGLE
% Preprocesses fundus photograph using Kaggle-style APTOS pipeline:
% 1. Crop uninformative black/dark borders using grayscale thresholding.
% 2. Resize to intermediate/target dimensions.
% 3. Ben Graham-style Gaussian blur subtraction and contrast enhancement:
%    enhanced = 4 * image - 4 * GaussianBlur(image) + 128
% 4. Preserves 3-channel RGB color.
%
% Inputs:
%   img        - Input RGB fundus image (uint8 or double)
%   targetSize - (Optional) [height width] vector, default [224 224]
%
% Output:
%   enhancedImg - Processed RGB image uint8 in [0, 255]

if nargin < 2 || isempty(targetSize)
    targetSize = [224 224];
end

% Ensure input is double [0, 255] for arithmetic
if isinteger(img)
    imgDouble = double(img);
else
    imgDouble = img;
    if max(imgDouble(:)) <= 1.0
        imgDouble = imgDouble * 255;
    end
end

% Ensure 3 channels
if size(imgDouble, 3) == 1
    imgDouble = repmat(imgDouble, 1, 1, 3);
end

%% STEP 1: Dark Border Cropping
% Compute grayscale for thresholding
gray = 0.299 * imgDouble(:,:,1) + 0.587 * imgDouble(:,:,2) + 0.114 * imgDouble(:,:,3);

% Threshold to identify non-black retinal region (intensity > 7 out of 255)
mask = gray > 7;

[rows, cols] = find(mask);

% Bounding box crop if valid mask found
if ~isempty(rows) && ~isempty(cols)
    rMin = min(rows); rMax = max(rows);
    cMin = min(cols); cMax = max(cols);
    
    % Ensure cropped region is at least 10% of image dimensions
    if (rMax - rMin >= size(imgDouble, 1) * 0.10) && (cMax - cMin >= size(imgDouble, 2) * 0.10)
        imgDouble = imgDouble(rMin:rMax, cMin:cMax, :);
    end
end

%% STEP 2: Resize to Target Resolution
imgResized = imresize(imgDouble, targetSize);

%% STEP 3: Ben Graham-Style Retinal Enhancement
% Calculate Gaussian blur using 1D separable convolution (pure MATLAB, no Image Processing Toolbox dependency)
sigma = targetSize(1) / 30;
kernelSize = max(3, 2 * ceil(3 * sigma) + 1);
halfK = floor(kernelSize / 2);
x = -halfK:halfK;
g1d = exp(-x.^2 / (2 * sigma^2));
g1d = g1d / sum(g1d);

blurImg = zeros(size(imgResized));
for c = 1:3
    temp = conv2(imgResized(:,:,c), g1d, 'same');
    blurImg(:,:,c) = conv2(temp, g1d', 'same');
end

% Ben Graham transformation: enhanced = 4 * image - 4 * blur + 128
enhanced = 4 * imgResized - 4 * blurImg + 128;

% Clip to valid uint8 range [0, 255]
enhanced = max(0, min(255, enhanced));
enhancedImg = uint8(enhanced);

end
