function [gradable, reason, focusScore, brightness, fovRatio] = ...
    imageQualityCheck(img)

% ============================================================
% IMAGE QUALITY ASSESSMENT
% Checks:
%   1. Focus / Sharpness
%   2. Illumination
%   3. Retinal Field of View
%
% Output:
%   gradable   -> true/false
%   reason     -> explanation for pass/failure
% ============================================================

% Convert image to double
img = double(img);

% Convert RGB to grayscale
if size(img,3) == 3
    gray = 0.299*img(:,:,1) + ...
           0.587*img(:,:,2) + ...
           0.114*img(:,:,3);
else
    gray = img;
end

% Normalize
gray = gray / 255;

%% 1. FOCUS / SHARPNESS

L = [0 1 0;
     1 -4 1;
     0 1 0];

lap = conv2(gray,L,'same');

focusScore = var(lap(:));

focusOK = focusScore >= 0.00008;


%% 2. ILLUMINATION

brightness = mean(gray(:));

brightnessOK = brightness >= 0.08 && ...
               brightness <= 0.40;


%% 3. FIELD OF VIEW

fovRatio = mean(gray(:) > 0.05);

fovOK = fovRatio >= 0.45;


%% FINAL DECISION

gradable = focusOK && brightnessOK && fovOK;


%% EXPLANATION

if gradable

    reason = "Image quality acceptable. Proceed to DR screening.";

else

    reasons = strings(0);

    if ~focusOK
        reasons(end+1) = "Poor focus / blurry image";
    end

    if ~brightnessOK
        reasons(end+1) = "Poor illumination";
    end

    if ~fovOK
        reasons(end+1) = "Insufficient retinal field of view";
    end

    reason = strjoin(reasons,"; ");

end

end