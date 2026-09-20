function evidence = extractLesionEvidence(binMasks, probMaps, retinalMask, maskOutputDir, imageId)
% EXTRACTLESIONEVIDENCE
% Extracts structured clinical-style lesion evidence from predicted segmentation masks.
% Pure MATLAB implementation (zero external toolbox dependency).
%
% Inputs:
%   binMasks: [H, W, 4] logical masks for [MA, HE, EX, SE]
%   probMaps: [H, W, 4] continuous probability maps in [0, 1]
%   retinalMask: [H, W] logical fundus aperture mask (optional)
%   maskOutputDir: optional directory to export individual mask PNGs
%   imageId: optional image identifier string for file naming
%
% Output:
%   evidence: struct matching the RetinoScan lesion schema:
%     retinalAnalysis:
%       lesions:
%         microaneurysms: struct
%         haemorrhages: struct
%         hardExudates: struct
%         softExudates: struct
%       summary: struct

if nargin < 3 || isempty(retinalMask)
    retinalMask = true(size(binMasks, 1), size(binMasks, 2));
end
if nargin < 4
    maskOutputDir = '';
end
if nargin < 5 || isempty(imageId)
    imageId = 'case';
end

[H, W, ~] = size(binMasks);
retinalArea = sum(retinalMask(:));
if retinalArea == 0
    retinalArea = H * W;
end

classNames = {'microaneurysms', 'haemorrhages', 'hardExudates', 'softExudates'};
classCodes = {'MA', 'HE', 'EX', 'SE'};
classLabels = {'Microaneurysms', 'Haemorrhages', 'Hard Exudates', 'Soft Exudates'};

lesionsStruct = struct();

for c = 1:4
    clsName = classNames{c};
    clsCode = classCodes{c};
    clsLabel = classLabels{c};
    
    mask = binMasks(:, :, c) & retinalMask;
    probs = probMaps(:, :, c);
    
    totalPx = sum(mask(:));
    relArea = double(totalPx) / double(retinalArea);
    isPresent = (totalPx > 0);
    
    % Save mask file if output directory specified
    maskFilePath = '';
    if ~isempty(maskOutputDir)
        if ~exist(maskOutputDir, 'dir')
            mkdir(maskOutputDir);
        end
        maskFileName = sprintf('%s_%s_pred_mask.png', imageId, clsCode);
        maskFilePath = fullfile(maskOutputDir, maskFileName);
        imwrite(uint8(mask * 255), maskFilePath);
    end
    
    % Pure MATLAB 8-connected component extraction
    components = [];
    largestArea = 0;
    
    if isPresent
        compList = extractComponentsPure(mask, probs, retinalArea, H, W);
        numComp = numel(compList);
        if numComp > 0
            largestArea = compList(1).area;
            components = compList;
        end
    else
        numComp = 0;
    end
    
    lesionsStruct.(clsName) = struct(...
        'code', clsCode, ...
        'label', clsLabel, ...
        'present', isPresent, ...
        'count', numComp, ...
        'totalPixelArea', totalPx, ...
        'relativeArea', relArea, ...
        'largestComponentArea', largestArea, ...
        'components', components, ...
        'maskPath', maskFilePath, ...
        'evidenceType', 'Model-predicted lesion evidence' ...
    );
end

% Top-level summary
evidence = struct();
evidence.retinalAnalysis = struct();
evidence.retinalAnalysis.lesions = lesionsStruct;
evidence.retinalAnalysis.summary = struct(...
    'imageId', imageId, ...
    'retinalFieldPixelArea', retinalArea, ...
    'totalLesionPixelArea', lesionsStruct.microaneurysms.totalPixelArea + ...
                            lesionsStruct.haemorrhages.totalPixelArea + ...
                            lesionsStruct.hardExudates.totalPixelArea + ...
                            lesionsStruct.softExudates.totalPixelArea, ...
    'hasMicroaneurysms', lesionsStruct.microaneurysms.present, ...
    'hasHaemorrhages', lesionsStruct.haemorrhages.present, ...
    'hasHardExudates', lesionsStruct.hardExudates.present, ...
    'hasSoftExudates', lesionsStruct.softExudates.present, ...
    'status', 'SUCCESS', ...
    'model', 'IDRiD-Lesion-UNet-v1', ...
    'disclaimer', 'Model-predicted lesion evidence only. Not a clinical diagnosis.' ...
);
end

function compList = extractComponentsPure(mask, probs, retinalArea, H, W)
% Pure-MATLAB BFS connected component extraction (zero toolboxes required)
posIdx = find(mask);
nPos = numel(posIdx);
if nPos == 0
    compList = [];
    return;
end

visited = false(H, W);
tempComps = cell(500, 1);
nFound = 0;

q = zeros(nPos, 2);

for k = 1:nPos
    idx = posIdx(k);
    if visited(idx)
        continue;
    end
    
    % Convert linear index to subscript
    c0 = ceil(idx / H);
    r0 = idx - (c0 - 1) * H;
    
    head = 1;
    tail = 1;
    q(1, 1) = r0;
    q(1, 2) = c0;
    visited(r0, c0) = true;
    
    while head <= tail
        currR = q(head, 1);
        currC = q(head, 2);
        head = head + 1;
        
        for dr = -1:1
            nr = currR + dr;
            if nr < 1 || nr > H, continue; end
            for dc = -1:1
                nc = currC + dc;
                if nc < 1 || nc > W, continue; end
                
                if mask(nr, nc) && ~visited(nr, nc)
                    visited(nr, nc) = true;
                    tail = tail + 1;
                    q(tail, 1) = nr;
                    q(tail, 2) = nc;
                end
            end
        end
    end
    
    compSize = tail;
    pts = q(1:tail, :);
    
    minR = min(pts(:, 1)); maxR = max(pts(:, 1));
    minC = min(pts(:, 2)); maxC = max(pts(:, 2));
    
    % Extract component probabilities
    compLinIdx = pts(:, 1) + (pts(:, 2) - 1) * H;
    compProbs = probs(compLinIdx);
    
    nFound = nFound + 1;
    cStruct = struct();
    cStruct.id = nFound;
    cStruct.area = compSize;
    cStruct.relativeArea = double(compSize) / double(retinalArea);
    cStruct.centroid = round([mean(pts(:, 2)), mean(pts(:, 1))], 1); % [x, y]
    cStruct.boundingBox = [minC, minR, maxC - minC + 1, maxR - minR + 1]; % [x, y, w, h]
    cStruct.meanProbability = round(mean(double(compProbs)), 4);
    cStruct.maxProbability = round(max(double(compProbs)), 4);
    
    if nFound > numel(tempComps)
        tempComps = [tempComps; cell(500, 1)]; %#ok<AGROW>
    end
    tempComps{nFound} = cStruct;
end

if nFound == 0
    compList = [];
    return;
end

allComps = [tempComps{1:nFound}];
areas = [allComps.area];
[~, sortIdx] = sort(areas, 'descend');
sortedComps = allComps(sortIdx);

% Cap at top 100 components to prevent bloated structures
nKeep = min(numel(sortedComps), 100);
compList = sortedComps(1:nKeep);
for i = 1:nKeep
    compList(i).id = i;
end
end
