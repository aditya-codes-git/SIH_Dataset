function renderedImg = renderRetinalAnalysis(origImg, retinalField, opticDisc, macula, findings, hotspots, varargin)
% RENDERRETINALANALYSIS
% Generates comprehensive clinical anatomical analysis composite (retinal_analysis.png).
% Pure MATLAB implementation using offscreen vector canvas.
%
% Legend:
%   ● Cyan Circle     = Optic Disc (OD)
%   ● Green Circle    = Estimated Macula / Fovea (MAC)
%   ● Yellow Badge    = Model Attention Hotspot (1, 2, ...)
%   □ Orange Box      = Candidate Abnormal Region (C1, C2, ...)
%
% Usage:
%   renderedImg = renderRetinalAnalysis(img, rf, od, mac, findings, hotspots, 'OutputPath', 'retinal_analysis.png')

p = inputParser;
addRequired(p, 'origImg');
addRequired(p, 'retinalField');
addRequired(p, 'opticDisc');
addRequired(p, 'macula');
addRequired(p, 'findings');
addRequired(p, 'hotspots');
addParameter(p, 'OutputPath', '', @ischar);
parse(p, origImg, retinalField, opticDisc, macula, findings, hotspots, varargin{:});

if ischar(origImg) || isstring(origImg)
    img = imread(char(origImg));
else
    img = origImg;
end

if isfloat(img) && max(img(:)) <= 1.0
    img = uint8(img * 255.0);
end

[H, W, ~] = size(img);
scaleFactor = max(W, H) / 1024.0;

% Set up offscreen canvas
fig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, W, H]);
ax = axes('Parent', fig, 'Position', [0, 0, 1, 1]);
imshow(img, 'Parent', ax);
hold(ax, 'on');

% 1. RETINAL FIELD OUTLINE (Subtle white dashed ellipse)
if isfield(retinalField, 'detected') && retinalField.detected
    th = linspace(0, 2*pi, 100);
    ellX = retinalField.centerX + retinalField.radiusX * cos(th);
    ellY = retinalField.centerY + retinalField.radiusY * sin(th);
    plot(ax, ellX, ellY, 'w--', 'LineWidth', max(1.5 * scaleFactor, 1.0));
end

% 2. OPTIC DISC (Cyan Circle + OD Label)
if isfield(opticDisc, 'detected') && opticDisc.detected && ~isnan(opticDisc.centerX)
    th = linspace(0, 2*pi, 60);
    odX = opticDisc.centerX + opticDisc.radius * cos(th);
    odY = opticDisc.centerY + opticDisc.radius * sin(th);
    plot(ax, odX, odY, 'Color', [0.0, 0.9, 1.0], 'LineWidth', max(2.5 * scaleFactor, 2.0));
    text(ax, opticDisc.centerX, opticDisc.centerY, 'OD', ...
        'Color', [0.0, 0.0, 0.0], 'FontSize', max(round(11 * scaleFactor), 9), ...
        'FontWeight', 'bold', 'HorizontalAlignment', 'center', ...
        'BackgroundColor', [0.0, 0.9, 1.0], 'Margin', 2);
end

% 3. MACULA / FOVEA (Green Circle + MAC Label)
if isfield(macula, 'estimated') && macula.estimated && ~isnan(macula.centerX)
    th = linspace(0, 2*pi, 60);
    macX = macula.centerX + macula.radius * cos(th);
    macY = macula.centerY + macula.radius * sin(th);
    plot(ax, macX, macY, 'Color', [0.2, 1.0, 0.3], 'LineWidth', max(2.2 * scaleFactor, 1.8), 'LineStyle', '-');
    text(ax, macula.centerX, macula.centerY, 'MAC', ...
        'Color', [0.0, 0.0, 0.0], 'FontSize', max(round(10 * scaleFactor), 8), ...
        'FontWeight', 'bold', 'HorizontalAlignment', 'center', ...
        'BackgroundColor', [0.2, 1.0, 0.3], 'Margin', 2);
end

% 4. CANDIDATE FINDINGS (Orange/Coral Bounding Boxes + "C1", "C2" Labels)
numFindings = length(findings);
for i = 1:numFindings
    f = findings(i);
    if ~isempty(f.bbox) && all(f.bbox(3:4) > 0)
        rectangle('Parent', ax, 'Position', f.bbox, ...
            'EdgeColor', [1.0, 0.45, 0.0], 'LineWidth', max(1.8 * scaleFactor, 1.2), 'LineStyle', '-');
        text(ax, f.bbox(1), f.bbox(2) - 4 * scaleFactor, sprintf('C%d', f.id), ...
            'Color', [1.0, 1.0, 1.0], 'FontSize', max(round(9 * scaleFactor), 8), ...
            'FontWeight', 'bold', 'BackgroundColor', [1.0, 0.40, 0.0], 'Margin', 1);
    end
end

% 5. GRAD-CAM ATTENTION HOTSPOTS (Yellow Badges + Numbers 1, 2, ...)
numHotspots = length(hotspots);
for j = 1:numHotspots
    h = hotspots(j);
    markerRad = max(round(15 * scaleFactor), 11);
    plot(ax, h.x, h.y, 'o', 'MarkerSize', markerRad, ...
        'MarkerEdgeColor', [0 0 0], 'MarkerFaceColor', [1.0, 0.90, 0.10], 'LineWidth', 1.5);
    text(ax, h.x, h.y, sprintf('%d', h.id), ...
        'Color', [0 0 0], 'FontSize', max(round(11 * scaleFactor), 9), ...
        'FontWeight', 'bold', 'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle');
end

% 6. ANATOMICAL ANALYSIS LEGEND BAR (Bottom Right)
legendStr = sprintf('RetinoScan AI Anatomical Analysis\nCyan: Optic Disc | Green: Macula | Orange: Candidate Finding | Yellow: Attention Hotspot');
text(ax, 20 * scaleFactor, H - 30 * scaleFactor, legendStr, ...
    'Color', [1 1 1], 'FontSize', max(round(10 * scaleFactor), 8), ...
    'BackgroundColor', [0 0 0], 'Margin', 4, 'FontWeight', 'bold');

hold(ax, 'off');
drawnow;

frame = getframe(ax);
renderedImg = frame.cdata;

if size(renderedImg, 1) ~= H || size(renderedImg, 2) ~= W
    renderedImg = imresize(renderedImg, [H, W]);
end

close(fig);

outPath = p.Results.OutputPath;
if ~isempty(outPath)
    [outDir, ~, ~] = fileparts(outPath);
    if ~isempty(outDir) && ~exist(outDir, 'dir'), mkdir(outDir); end
    imwrite(renderedImg, outPath);
end

end
