function [X_aug, Y_aug] = augmentLesionPatches(X, Y)
% AUGMENTLESIONPATCHES
% Applies lesion-preserving spatial and intensity data augmentation strictly to
% training patches.
%
% Supported augmentations:
%   - Random horizontal flip (50% probability)
%   - Random vertical flip (50% probability)
%   - Random 90-degree orthogonal rotation
%   - Mild random contrast/brightness scaling (+-10%)
%
% Inputs:
%   X: [H, W, 3, B] single normalized in [0, 1]
%   Y: [H, W, 4, B] single binary labels in {0, 1}

B = size(X, 4);
X_aug = X;
Y_aug = Y;

for i = 1:B
    img = X(:, :, :, i);
    mask = Y(:, :, :, i);
    
    % 1. Random horizontal flip
    if rand() > 0.5
        img = fliplr(img);
        mask = fliplr(mask);
    end
    
    % 2. Random vertical flip
    if rand() > 0.5
        img = flipud(img);
        mask = flipud(mask);
    end
    
    % 3. Random 90-degree rotation (k = 0, 1, 2, 3)
    kRot = randi([0, 3]);
    if kRot > 0
        img = rot90(img, kRot);
        mask = rot90(mask, kRot);
    end
    
    % 4. Mild brightness adjustment (+-10%)
    scaleFactor = 0.90 + 0.20 * rand();
    img = min(1.0, max(0.0, img * scaleFactor));
    
    X_aug(:, :, :, i) = img;
    Y_aug(:, :, :, i) = mask;
end
end
