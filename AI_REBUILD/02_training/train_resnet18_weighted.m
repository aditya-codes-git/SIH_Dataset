function [net, metrics] = train_resnet18_weighted()
% TRAIN_RESNET18_WEIGHTED
% Experiment C: R18-WEIGHTED
% ResNet-18 without augmentation, but with class-weighted cross-entropy loss.

baseDir = fileparts(mfilename('fullpath'));
addpath(baseDir);
[net, metrics] = run_experiment('R18-WEIGHTED');

end
