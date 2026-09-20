classdef weightedClassificationLayer < nnet.layer.ClassificationLayer
    % WEIGHTEDCLASSIFICATIONLAYER Custom weighted cross-entropy classification layer
    % Penalizes under-represented classes (Grades 1, 3, 4) more heavily during training.

    properties
        ClassWeights
    end

    methods
        function layer = weightedClassificationLayer(classWeights, name)
            layer.ClassWeights = single(classWeights(:));
            if nargin > 1 && ~isempty(name)
                layer.Name = name;
            else
                layer.Name = 'weighted_classoutput';
            end
            layer.Description = 'Weighted Cross-Entropy Loss for Imbalanced Diabetic Retinopathy';
        end

        function loss = forwardLoss(layer, Y, T)
            % Y: Softmax predictions (numClasses x miniBatchSize)
            % T: Ground truth targets (numClasses x miniBatchSize)
            W = layer.ClassWeights;
            N = size(Y, 2);
            epsVal = single(1e-7);
            loss = -sum(sum(W .* T .* log(Y + epsVal))) / single(N);
        end
    end
end
