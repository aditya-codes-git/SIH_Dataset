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

        % Save Grad-CAM image
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

    % Convert result to JSON
    jsonText = jsonencode(response);

    % Write JSON file
    fid = fopen(outputPath,'w');
    fprintf(fid,'%s',jsonText);
    fclose(fid);

end