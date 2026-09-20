function renderedImg = renderAttentionPoints(baseImg, hotspots, varargin)
% RENDERATTENTIONPOINTS
% Overlays numbered model-attention hotspot badges and bounding boxes onto
% the high-resolution fundus or Grad-CAM overlay image.
%
% Usage:
%   renderedImg = renderAttentionPoints(baseImg, hotspots)
%   renderedImg = renderAttentionPoints(baseImg, hotspots, 'OutputPath', 'out.png')

p = inputParser;
addRequired(p, 'baseImg');
addRequired(p, 'hotspots');
addParameter(p, 'OutputPath', '', @ischar);
addParameter(p, 'LineWidth', 2.0, @isnumeric);
addParameter(p, 'FontSize', 14, @isnumeric);
parse(p, baseImg, hotspots, varargin{:});

if ischar(baseImg) || isstring(baseImg)
    img = imread(char(baseImg));
else
    img = baseImg;
end

if isfloat(img) && max(img(:)) <= 1.0
    img = uint8(img * 255.0);
end

[H, W, ~] = size(img);
numHotspots = length(hotspots);

if numHotspots == 0
    renderedImg = img;
    if ~isempty(p.Results.OutputPath)
        imwrite(renderedImg, p.Results.OutputPath);
    end
    return;
end

% Set up offscreen canvas preserving exact image dimensions
fig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, W, H]);
ax = axes('Parent', fig, 'Position', [0, 0, 1, 1]);
imshow(img, 'Parent', ax);
hold(ax, 'on');

% Dynamic font scaling relative to image resolution
scaleFactor = max(W, H) / 1024.0;
fontSize = max(round(p.Results.FontSize * scaleFactor), 10);
lineWidth = max(round(p.Results.LineWidth * scaleFactor), 1.5);
markerSize = max(round(16 * scaleFactor), 12);

% Distinct high-visibility palette for bounding boxes and badges
palette = [
    0.95, 0.20, 0.20; % 1: Crimson Red
    1.00, 0.60, 0.10; % 2: Amber Orange
    0.20, 0.80, 0.20; % 3: Vibrant Green
    0.10, 0.70, 1.00; % 4: Sky Blue
    0.80, 0.30, 0.90; % 5: Orchid Purple
    1.00, 0.85, 0.10; % 6: Bright Yellow
    0.20, 0.90, 0.80; % 7: Teal
    0.90, 0.50, 0.70  % 8: Rose Pink
];

for k = 1:numHotspots
    h = hotspots(k);
    color = palette(mod(k - 1, size(palette, 1)) + 1, :);
    
    % 1. Draw Subtle Bounding Box
    if isfield(h, 'bbox') && ~isempty(h.bbox) && all(h.bbox(3:4) > 0)
        rectangle('Parent', ax, ...
            'Position', h.bbox, ...
            'EdgeColor', color, ...
            'LineWidth', lineWidth, ...
            'LineStyle', '-');
    end
    
    % 2. Draw Centroid Circle Marker
    plot(ax, h.x, h.y, 'o', ...
        'MarkerSize', markerSize, ...
        'MarkerEdgeColor', [1 1 1], ...
        'MarkerFaceColor', color, ...
        'LineWidth', 1.5);
    
    % 3. Draw Numbered Badge Inside Marker
    text(ax, h.x, h.y, sprintf('%d', h.id), ...
        'Color', [1 1 1], ...
        'FontSize', fontSize, ...
        'FontWeight', 'bold', ...
        'HorizontalAlignment', 'center', ...
        'VerticalAlignment', 'middle');
end

hold(ax, 'off');
drawnow;

% Capture rendered canvas
frame = getframe(ax);
renderedImg = frame.cdata;

% Ensure exact dimension match
if size(renderedImg, 1) ~= H || size(renderedImg, 2) ~= W
    renderedImg = imresize(renderedImg, [H, W]);
end

close(fig);

% Save to file if output path specified
outPath = p.Results.OutputPath;
if ~isempty(outPath)
    [outDir, ~, ~] = fileparts(outPath);
    if ~isempty(outDir) && ~exist(outDir, 'dir')
        mkdir(outDir);
    end
    imwrite(renderedImg, outPath);
end

end
