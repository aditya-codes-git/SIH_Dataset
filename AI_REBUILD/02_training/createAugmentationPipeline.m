function augmentedImds = createAugmentationPipeline(imds, inputSize)
% CREATEAUGMENTATIONPIPELINE
% Creates a medically sound fundus data augmentation pipeline for training data only.
%
% Parameters applied:
%   - Horizontal flip (reflection in X)
%   - Vertical flip (reflection in Y)
%   - Small rotation: [-15, +15] degrees
%   - Small translation: [-5, +5] pixels in X and Y
%   - Mild scale variation: [0.95, 1.05] (5% zoom in/out)
%
% Never applies non-rigid distortions, color destruction, or severe rotations that
% obscure or falsify subtle microaneurysms, hemorrhages, or exudates.

if nargin < 2 || isempty(inputSize)
    inputSize = [224 224 3];
end

augmenter = imageDataAugmenter( ...
    'RandXReflection', true, ...
    'RandYReflection', true, ...
    'RandRotation', [-15 15], ...
    'RandXTranslation', [-5 5], ...
    'RandYTranslation', [-5 5], ...
    'RandXScale', [0.95 1.05], ...
    'RandYScale', [0.95 1.05]);

augmentedImds = augmentedImageDatastore(inputSize(1:2), imds, ...
    'DataAugmentation', augmenter, ...
    'ColorPreprocessing', 'gray2rgb');

fprintf('[AUGMENTATION] Created fundus augmentation pipeline for %d images (Input size: %dx%d)\n', ...
    numel(imds.Files), inputSize(1), inputSize(2));

end
