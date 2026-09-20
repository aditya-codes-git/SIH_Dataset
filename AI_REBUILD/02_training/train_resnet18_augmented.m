function [net, metrics] = train_resnet18_augmented()
% TRAIN_RESNET18_AUGMENTED
% Experiment B: R18-AUG
% ResNet-18 with fundus data augmentation and standard cross-entropy loss.

baseDir = fileparts(mfilename('fullpath'));
addpath(baseDir);
[net, metrics] = run_experiment('R18-AUG');

end
