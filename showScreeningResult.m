function showScreeningResult(result, originalImg)

figure('Name','AI-Assisted DR Screening Report', ...
    'NumberTitle','off', ...
    'Color','white', ...
    'Position',[100 100 1200 700]);

%% TITLE
annotation('textbox',[0.20 0.93 0.60 0.06], ...
    'String','AI-ASSISTED DIABETIC RETINOPATHY SCREENING', ...
    'HorizontalAlignment','center', ...
    'FontSize',18, ...
    'FontWeight','bold', ...
    'Color','black', ...
    'EdgeColor','none');

%% FUNDUS IMAGE
subplot(2,2,1);
imshow(originalImg);
title('Fundus Image','FontSize',14,'FontWeight','bold','Color','black');

%% GRAD-CAM
subplot(2,2,2);

if result.status == "GRADABLE"
    imshow(result.processedImage);
    hold on;
    imagesc(result.scoreMap,'AlphaData',0.35);
    colormap jet;
    colorbar;
    title('Grad-CAM: Model Attention', ...
        'FontSize',14,'FontWeight','bold','Color','black');
    hold off;
else
    axis off;
    title('Grad-CAM unavailable','Color','black');
end

%% SCREENING RESULT
subplot(2,2,3);
axis off;

text(0,0.90,'SCREENING RESULT', ...
    'FontSize',16,'FontWeight','bold','Color','black');

if result.status == "GRADABLE"

    text(0,0.70,['Image Quality: ' char(result.status)], ...
        'FontSize',13,'Color','black');

    text(0,0.52,['DR Grade: ' num2str(result.grade)], ...
        'FontSize',13,'Color','black');

    text(0,0.34,['Confidence: ' ...
        num2str(result.confidence*100,'%.2f') '%'], ...
        'FontSize',13,'Color','black');

    text(0,0.16,['Referral: ' char(result.referral)], ...
        'FontSize',13,'FontWeight','bold','Color','black');

else

    text(0,0.70,'Image Quality: UNGRADABLE', ...
        'FontSize',13,'FontWeight','bold','Color','black');

    text(0,0.50,['Reason: ' char(result.quality.reason)], ...
        'FontSize',11,'Color','black');

    text(0,0.30,'Action: Please recapture retinal image.', ...
        'FontSize',11,'Color','black');

end

%% QUALITY METRICS
subplot(2,2,4);
axis off;

text(0,0.90,'IMAGE QUALITY METRICS', ...
    'FontSize',16,'FontWeight','bold','Color','black');

text(0,0.70,['Focus: ' ...
    num2str(result.quality.focusScore,'%.6f')], ...
    'FontSize',12,'Color','black');

text(0,0.52,['Brightness: ' ...
    num2str(result.quality.brightness,'%.4f')], ...
    'FontSize',12,'Color','black');

text(0,0.34,['FOV Ratio: ' ...
    num2str(result.quality.fovRatio,'%.4f')], ...
    'FontSize',12,'Color','black');

text(0,0.08, ...
    'AI decision-support only. Final decision by ophthalmologist.', ...
    'FontSize',9,'Color','black');

end