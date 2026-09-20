function [probMaps, origSize] = predictLesions(img, modelInput, varargin)
% PREDICTLESIONS
% Performs tiled deep learning inference on a full-resolution fundus image
% using the trained U-Net lesion segmentation model.
%
% Algorithm:
%   1. Resizes input image to standard inference scale [1424, 2144] (maintains
%      aspect ratio and prevents MA signal loss).
%   2. Decomposes into overlapping 256x256 tiles with 64px overlap (stride 192).
%   3. Evaluates dlnetwork on GPU (or CPU if specified).
%   4. Blends overlapping probability predictions using distance-weighted averaging.
%   5. Resizes probability maps back to original native resolution.
%
% Output:
%   probMaps: [H_orig, W_orig, 4] single probabilities in [0, 1]
%             Channel 1: MA (Microaneurysms)
%             Channel 2: HE (Haemorrhages)
%             Channel 3: EX (Hard Exudates)
%             Channel 4: SE (Soft Exudates)

scriptDir = fileparts(mfilename('fullpath'));
defaultModelPath = fullfile(fileparts(scriptDir), 'segmentation_training', 'models', 'best_lesion_unet.mat');

if nargin < 2 || isempty(modelInput)
    modelInput = defaultModelPath;
end

% Resolve Network
if isa(modelInput, 'dlnetwork')
    net = modelInput;
elseif isstruct(modelInput) && isfield(modelInput, 'net')
    net = modelInput.net;
else
    persistent cachedNet cachedModelPath
    if isempty(cachedNet) || ~isequal(cachedModelPath, modelInput)
        loaded = load(modelInput, 'net');
        cachedNet = loaded.net;
        cachedModelPath = modelInput;
    end
    net = cachedNet;
end

% Resolve Options
opts = struct();
if numel(varargin) == 1 && isstruct(varargin{1})
    opts = varargin{1};
elseif numel(varargin) >= 1
    if numel(varargin) >= 1 && ~isempty(varargin{1})
        if isscalar(varargin{1})
            opts.patchSize = [varargin{1}, varargin{1}];
        else
            opts.patchSize = varargin{1};
        end
    end
    if numel(varargin) >= 2 && ~isempty(varargin{2})
        opts.stride = varargin{2};
    end
    if numel(varargin) >= 3 && ~isempty(varargin{3})
        opts.useGPU = varargin{3};
    end
end

if ~isfield(opts, 'patchSize'), opts.patchSize = [256, 256]; end
if ~isfield(opts, 'stride'), opts.stride = 192; end
if ~isfield(opts, 'targetSize'), opts.targetSize = [1424, 2144]; end % [H, W]
if ~isfield(opts, 'useGPU'), opts.useGPU = true; end

% Handle path or matrix input
if ischar(img) || isstring(img)
    img = imread(char(img));
end

origSize = [size(img, 1), size(img, 2)];
H_orig = origSize(1);
W_orig = origSize(2);

% If targetSize is not explicitly specified, use default for full fundus images [1424, 2144]
% but adapt automatically if test images are smaller
if ~isfield(opts, 'targetSize')
    if H_orig < 1000 || W_orig < 1000
        opts.targetSize = [max(H_orig, pH), max(W_orig, pW)];
    else
        opts.targetSize = [1424, 2144]; % [H, W] standard resolution
    end
end

tH = opts.targetSize(1);
tW = opts.targetSize(2);
pH = opts.patchSize(1);
pW = opts.patchSize(2);
stride = opts.stride;

imgResized = imresize(img, [tH, tW]);
imgNorm = single(imgResized) / 255.0;

% Compute tile grid
rSteps = 1:stride:(tH - pH + 1);
if isempty(rSteps) || rSteps(end) ~= (tH - pH + 1)
    rSteps = [rSteps, tH - pH + 1];
end
cSteps = 1:stride:(tW - pW + 1);
if isempty(cSteps) || cSteps(end) ~= (tW - pW + 1)
    cSteps = [cSteps, tW - pW + 1];
end

% Blending window (2D linear tent)
wR = bartlett(pH);
wC = bartlett(pW);
blendWeight = single(wR * wC');
blendWeight = max(blendWeight, 0.05);

accumProb = zeros(tH, tW, 4, 'single');
accumWeight = zeros(tH, tW, 'single');

useGpu = opts.useGPU && (gpuDeviceCount > 0);

for r = rSteps
    for c = cSteps
        patch = imgNorm(r:(r + pH - 1), c:(c + pW - 1), :);
        dlPatch = dlarray(patch, 'SSCB');
        if useGpu
            dlPatch = gpuArray(dlPatch);
        end
        
        dlPred = predict(net, dlPatch);
        pred = extractdata(dlPred);
        if useGpu
            pred = gather(pred);
        end
        
        for ch = 1:4
            accumProb(r:(r + pH - 1), c:(c + pW - 1), ch) = ...
                accumProb(r:(r + pH - 1), c:(c + pW - 1), ch) + pred(:, :, ch) .* blendWeight;
        end
        accumWeight(r:(r + pH - 1), c:(c + pW - 1)) = ...
            accumWeight(r:(r + pH - 1), c:(c + pW - 1)) + blendWeight;
    end
end

% Normalize by accumulated weights
probMapsSmall = accumProb ./ max(accumWeight, 1e-6);

% Resize back to native resolution
probMaps = zeros(H_orig, W_orig, 4, 'single');
for ch = 1:4
    probMaps(:, :, ch) = imresize(probMapsSmall(:, :, ch), [H_orig, W_orig], 'bilinear');
end

probMaps = min(max(probMaps, 0.0), 1.0);
end

function w = bartlett(L)
% Pure-MATLAB Bartlett triangular window
if L == 1
    w = 1;
    return;
end
N = L - 1;
n = (0:N)';
w = 1 - abs(2*n - N) / N;
end
