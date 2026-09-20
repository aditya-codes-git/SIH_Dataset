function [net, metrics] = train_resnet18_baseline_v2()
% TRAIN_RESNET18_BASELINE_V2
% Experiment A: R18-V2-BASELINE
% Clean reproduction of baseline ResNet-18 on canonical split (no aug, standard loss).

baseDir = fileparts(mfilename('fullpath'));
addpath(baseDir);
[net, metrics] = run_experiment('R18-V2-BASELINE');

end
