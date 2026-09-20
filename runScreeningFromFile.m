function runScreeningFromFile(inputPath, outputPath, gradcamPath)

    % Read image
    img = imread(inputPath);

    % Run complete screening pipeline
    result = drScreen(img);

    % Prepare response
    response = struct();

    response.status = char(result.status);

    response.quality = struct( ...
        'gradable', logical(result.quality.gradable), ...
        'reason', char(result.quality.reason), ...
        'focusScore', double(result.quality.focusScore), ...
        'brightness', double(result.quality.brightness), ...
        'fovRatio', double(result.quality.fovRatio));

    if result.status == "UNGRADABLE"

        response.message = char(result.message);

    else

        response.grade = double(result.grade);
        response.predictedClass = char(result.predictedClass);
        response.confidence = double(result.confidence);
        response.referable = logical(result.referable);
        response.referral = char(result.referral);

        % Save Phase 4.5 High-Resolution Multi-Scale Grad-CAM
        aiRebuildDir = fullfile(fileparts(mfilename('fullpath')), 'AI_REBUILD');
        addpath(fullfile(aiRebuildDir, '06_explainability'));
        addpath(fullfile(aiRebuildDir, '07_retinal_analysis'));
        addpath(fullfile(aiRebuildDir, '04_calibration'));
        addpath(fullfile(aiRebuildDir, '02_training'));

        hasImprovedGradCAM = false;
        if exist('generateImprovedGradCAM', 'file')
            try
                modelFile = fullfile(aiRebuildDir, '02_training', 'models', 'trained_dr_model_r18_final_candidate.mat');
                gradRes = generateImprovedGradCAM(img, 'ModelFile', modelFile, 'Strategy', 'MultiScaleFusion');
                imwrite(uint8(gradRes.overlayImage * 255), gradcamPath);
                response.gradcamPath = gradcamPath;
                hasImprovedGradCAM = true;
            catch ME_GRADCAM
                warning('ScreeningRunner:ImprovedGradCAMFailed', 'generateImprovedGradCAM failed: %s', ME_GRADCAM.message);
            end
        end

        if ~hasImprovedGradCAM
            figure('Visible','off');
            imshow(result.processedImage);
            hold on;
            imagesc(result.scoreMap,'AlphaData',0.35);
            colormap jet;
            axis off;
            hold off;
            exportgraphics(gca,gradcamPath);
            close;
            response.gradcamPath = gradcamPath;
        end

        % Optional Retinal Anatomical & Deep Learning Lesion Evidence Integration
        try
            analysisOutDir = fileparts(outputPath);
            [~, fileBaseName] = fileparts(outputPath);
            prefix = strrep(fileBaseName, '_result', '');
            
            aiRebuildDir = fullfile(fileparts(mfilename('fullpath')), 'AI_REBUILD');
            addpath(fullfile(aiRebuildDir, '07_retinal_analysis'));
            addpath(fullfile(aiRebuildDir, '06_explainability'));
            addpath(fullfile(aiRebuildDir, '04_calibration'));
            addpath(fullfile(aiRebuildDir, '02_training'));
            
            % Add Phase 3 Calibrated Probabilities if calibration exists
            calibParamFile = fullfile(aiRebuildDir, '04_calibration', 'calibration_parameters.mat');
            if exist(calibParamFile, 'file')
                calibData = load(calibParamFile);
                temp = calibData.calibration.temperature;
                % Classify scores mapping
                if isfield(result, 'confidence')
                    % Raw scores approximation or exact softmax logits if available
                    % Populate probability distribution
                    scores = zeros(1, 5);
                    gIdx = round(result.grade) + 1;
                    if gIdx >= 1 && gIdx <= 5
                        scores(gIdx) = result.confidence;
                        remConf = (1.0 - result.confidence) / 4.0;
                        for si = 1:5
                            if si ~= gIdx, scores(si) = remConf; end
                        end
                    end
                    response.probabilities = scores;
                    response.rawConfidence = result.confidence;
                    
                    % Calibrated softmax with temperature
                    logits = log(max(scores, 1e-6));
                    scaledLogits = logits / temp;
                    scaledLogits = scaledLogits - max(scaledLogits);
                    calibProbs = exp(scaledLogits) / sum(exp(scaledLogits));
                    
                    response.calibratedProbabilities = calibProbs;
                    response.calibratedConfidence = calibProbs(gIdx);
                    response.referableRiskProbability = sum(calibProbs(3:5));
                    response.calibration = struct(...
                        'calibrated', true, ...
                        'temperature', temp, ...
                        'method', 'TemperatureScaling', ...
                        'modelVersion', 'R18-FINAL-CANDIDATE');
                end
            end
            
            % Run full retinal anatomical + deep learning lesion evidence
            if exist('runFullRetinalAnalysis', 'file')
                retinalRes = runFullRetinalAnalysis(img, analysisOutDir, 'Prefix', prefix);
                response.retinalAnalysis = retinalRes;
                
                % Ensure gradcamPath matches the Phase 4.5 high-resolution overlay asset
                if isfield(retinalRes, 'assets') && isfield(retinalRes.assets, 'gradcamOverlay') && exist(retinalRes.assets.gradcamOverlay, 'file')
                    copyfile(retinalRes.assets.gradcamOverlay, gradcamPath);
                    response.gradcamPath = gradcamPath;
                end
            end
        catch ME_ANALYSIS
            % Non-blocking safety: screening response proceeds even if analysis engine fails
            warning('ScreeningRunner:AnalysisSkipped', 'Retinal/lesion analysis skipped: %s', ME_ANALYSIS.message);
        end

    end

    % Convert result to JSON
    jsonText = jsonencode(response);

    % Write JSON file
    fid = fopen(outputPath,'w');
    fprintf(fid,'%s',jsonText);
    fclose(fid);

end