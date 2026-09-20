function net = buildLesionUnet(inputSize, numClasses)
% BUILDLESIONUNET
% Constructs a lightweight, parameter-efficient U-Net architecture for
% multi-lesion retinal segmentation using pure MATLAB Deep Learning Toolbox.
%
% Architecture:
%   - Input: [H, W, 3]
%   - Encoder: 3 levels (16, 32, 64 filters) with Conv3x3-BN-ReLU-Conv3x3-BN-ReLU + MaxPool2x2
%   - Bottleneck: 128 filters
%   - Decoder: 3 levels (64, 32, 16 filters) with TransposedConv2x2 + DepthConcat + Conv3x3-BN-ReLU
%   - Final Head: Conv1x1 (numClasses) + Sigmoid activation
%
% Output: dlnetwork object ready for custom GPU training with dlgradient

if nargin < 1 || isempty(inputSize)
    inputSize = [256, 256, 3];
end
if nargin < 2 || isempty(numClasses)
    numClasses = 4; % MA, HE, EX, SE
end

lgraph = layerGraph();

% Encoder Level 1 (256x256)
inLayers = [
    imageInputLayer(inputSize, 'Normalization', 'none', 'Name', 'input')
    convolution2dLayer(3, 16, 'Padding', 'same', 'Name', 'e1_c1')
    batchNormalizationLayer('Name', 'e1_bn1')
    reluLayer('Name', 'e1_r1')
    convolution2dLayer(3, 16, 'Padding', 'same', 'Name', 'e1_c2')
    batchNormalizationLayer('Name', 'e1_bn2')
    reluLayer('Name', 'e1_r2')
];
p1 = maxPooling2dLayer(2, 'Stride', 2, 'Name', 'p1');

% Encoder Level 2 (128x128)
e2 = [
    convolution2dLayer(3, 32, 'Padding', 'same', 'Name', 'e2_c1')
    batchNormalizationLayer('Name', 'e2_bn1')
    reluLayer('Name', 'e2_r1')
    convolution2dLayer(3, 32, 'Padding', 'same', 'Name', 'e2_c2')
    batchNormalizationLayer('Name', 'e2_bn2')
    reluLayer('Name', 'e2_r2')
];
p2 = maxPooling2dLayer(2, 'Stride', 2, 'Name', 'p2');

% Encoder Level 3 (64x64)
e3 = [
    convolution2dLayer(3, 64, 'Padding', 'same', 'Name', 'e3_c1')
    batchNormalizationLayer('Name', 'e3_bn1')
    reluLayer('Name', 'e3_r1')
    convolution2dLayer(3, 64, 'Padding', 'same', 'Name', 'e3_c2')
    batchNormalizationLayer('Name', 'e3_bn2')
    reluLayer('Name', 'e3_r2')
];
p3 = maxPooling2dLayer(2, 'Stride', 2, 'Name', 'p3');

% Bottleneck (32x32)
b = [
    convolution2dLayer(3, 128, 'Padding', 'same', 'Name', 'b_c1')
    batchNormalizationLayer('Name', 'b_bn1')
    reluLayer('Name', 'b_r1')
    convolution2dLayer(3, 128, 'Padding', 'same', 'Name', 'b_c2')
    batchNormalizationLayer('Name', 'b_bn2')
    reluLayer('Name', 'b_r2')
];

% Decoder Level 3 (64x64)
u3 = transposedConv2dLayer(2, 64, 'Stride', 2, 'Name', 'u3');
concat3 = depthConcatenationLayer(2, 'Name', 'cat3');
d3 = [
    convolution2dLayer(3, 64, 'Padding', 'same', 'Name', 'd3_c1')
    batchNormalizationLayer('Name', 'd3_bn1')
    reluLayer('Name', 'd3_r1')
    convolution2dLayer(3, 64, 'Padding', 'same', 'Name', 'd3_c2')
    batchNormalizationLayer('Name', 'd3_bn2')
    reluLayer('Name', 'd3_r2')
];

% Decoder Level 2 (128x128)
u2 = transposedConv2dLayer(2, 32, 'Stride', 2, 'Name', 'u2');
concat2 = depthConcatenationLayer(2, 'Name', 'cat2');
d2 = [
    convolution2dLayer(3, 32, 'Padding', 'same', 'Name', 'd2_c1')
    batchNormalizationLayer('Name', 'd2_bn1')
    reluLayer('Name', 'd2_r1')
    convolution2dLayer(3, 32, 'Padding', 'same', 'Name', 'd2_c2')
    batchNormalizationLayer('Name', 'd2_bn2')
    reluLayer('Name', 'd2_r2')
];

% Decoder Level 1 (256x256)
u1 = transposedConv2dLayer(2, 16, 'Stride', 2, 'Name', 'u1');
concat1 = depthConcatenationLayer(2, 'Name', 'cat1');
d1 = [
    convolution2dLayer(3, 16, 'Padding', 'same', 'Name', 'd1_c1')
    batchNormalizationLayer('Name', 'd1_bn1')
    reluLayer('Name', 'd1_r1')
    convolution2dLayer(3, 16, 'Padding', 'same', 'Name', 'd1_c2')
    batchNormalizationLayer('Name', 'd1_bn2')
    reluLayer('Name', 'd1_r2')
    convolution2dLayer(1, numClasses, 'Name', 'final_conv')
    sigmoidLayer('Name', 'output')
];

% Add layers
lgraph = addLayers(lgraph, inLayers);
lgraph = addLayers(lgraph, p1);
lgraph = addLayers(lgraph, e2);
lgraph = addLayers(lgraph, p2);
lgraph = addLayers(lgraph, e3);
lgraph = addLayers(lgraph, p3);
lgraph = addLayers(lgraph, b);
lgraph = addLayers(lgraph, u3);
lgraph = addLayers(lgraph, concat3);
lgraph = addLayers(lgraph, d3);
lgraph = addLayers(lgraph, u2);
lgraph = addLayers(lgraph, concat2);
lgraph = addLayers(lgraph, d2);
lgraph = addLayers(lgraph, u1);
lgraph = addLayers(lgraph, concat1);
lgraph = addLayers(lgraph, d1);

% Connect skip connections and main flow
lgraph = connectLayers(lgraph, 'e1_r2', 'p1');
lgraph = connectLayers(lgraph, 'p1', 'e2_c1');

lgraph = connectLayers(lgraph, 'e2_r2', 'p2');
lgraph = connectLayers(lgraph, 'p2', 'e3_c1');

lgraph = connectLayers(lgraph, 'e3_r2', 'p3');
lgraph = connectLayers(lgraph, 'p3', 'b_c1');

lgraph = connectLayers(lgraph, 'b_r2', 'u3');
lgraph = connectLayers(lgraph, 'u3', 'cat3/in1');
lgraph = connectLayers(lgraph, 'e3_r2', 'cat3/in2');
lgraph = connectLayers(lgraph, 'cat3', 'd3_c1');

lgraph = connectLayers(lgraph, 'd3_r2', 'u2');
lgraph = connectLayers(lgraph, 'u2', 'cat2/in1');
lgraph = connectLayers(lgraph, 'e2_r2', 'cat2/in2');
lgraph = connectLayers(lgraph, 'cat2', 'd2_c1');

lgraph = connectLayers(lgraph, 'd2_r2', 'u1');
lgraph = connectLayers(lgraph, 'u1', 'cat1/in1');
lgraph = connectLayers(lgraph, 'e1_r2', 'cat1/in2');
lgraph = connectLayers(lgraph, 'cat1', 'd1_c1');

net = dlnetwork(lgraph);
end
