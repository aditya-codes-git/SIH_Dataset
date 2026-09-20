function [net, metrics] = train_resnet18_final()
% TRAIN_RESNET18_FINAL
% Experiment E: R18-FINAL-CANDIDATE
% ResNet-18 with fundus data augmentation, class-weighted cross-entropy loss, and tuned learning rate schedule.

baseDir = fileparts(mfilename('fullpath'));
addpath(baseDir);
[net, metrics] = run_experiment('R18-FINAL-CANDIDATE');

end
