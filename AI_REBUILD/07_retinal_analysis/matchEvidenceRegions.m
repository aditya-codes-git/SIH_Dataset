function evidenceRegions = matchEvidenceRegions(findings, hotspots, heatmap, varargin)
% MATCHEVIDENCEREGIONS
% Cross-references image-processing candidate findings with Grad-CAM model
% attention hotspots and anatomical landmarks.
%
% CRITICAL CLINICAL RULE:
% Attention overlap does NOT convert a candidate finding into a confirmed lesion.
% It solely establishes that the candidate region is "supported by model attention".
%
% Output:
%   evidenceRegions(k).candidateId
%   evidenceRegions(k).candidateType
%   evidenceRegions(k).attentionOverlap
%   evidenceRegions(k).nearestHotspotId
%   evidenceRegions(k).distanceToNearestHotspot
%   evidenceRegions(k).attentionStrength
%   evidenceRegions(k).supportedByModelAttention
%   evidenceRegions(k).anatomicalContext
%   evidenceRegions(k).source
%   evidenceRegions(k).status

p = inputParser;
addRequired(p, 'findings');
addRequired(p, 'hotspots');
addRequired(p, 'heatmap');
addParameter(p, 'OpticDisc', [], @(x) isempty(x) || isstruct(x));
addParameter(p, 'Macula', [], @(x) isempty(x) || isstruct(x));
addParameter(p, 'RetinalField', [], @(x) isempty(x) || isstruct(x));
parse(p, findings, hotspots, heatmap, varargin{:});

od = p.Results.OpticDisc;
mac = p.Results.Macula;
rf = p.Results.RetinalField;

numFindings = length(findings);
if numFindings == 0
    evidenceRegions = struct([]);
    return;
end

numHotspots = length(hotspots);
[H, W] = size(heatmap);

evidenceRegions = repmat(struct(...
    'candidateId', 0, ...
    'candidateType', '', ...
    'attentionOverlap', false, ...
    'nearestHotspotId', 0, ...
    'distanceToNearestHotspot', 0, ...
    'normalizedDistance', 0, ...
    'attentionStrength', 0, ...
    'supportedByModelAttention', false, ...
    'anatomicalContext', '', ...
    'source', 'image_processing', ...
    'status', 'candidate'), numFindings, 1);

for i = 1:numFindings
    f = findings(i);
    fx = f.centerX;
    fy = f.centerY;
    
    % 1. SAMPLE GRAD-CAM ATTENTION VALUE AT CANDIDATE CENTROID
    clampedX = max(min(fx, W), 1);
    clampedY = max(min(fy, H), 1);
    attStrength = heatmap(clampedY, clampedX);
    
    % 2. COMPUTE OVERLAP AND DISTANCE TO ATTENTION HOTSPOTS
    hasOverlap = false;
    nearestId = 0;
    minDist = Inf;
    
    if numHotspots > 0
        for j = 1:numHotspots
            h = hotspots(j);
            dist = sqrt((fx - h.x)^2 + (fy - h.y)^2);
            if dist < minDist
                minDist = dist;
                nearestId = h.id;
            end
            
            % Check bounding box intersection
            if ~isempty(f.bbox) && ~isempty(h.bbox)
                xOverlap = max(0, min(f.bbox(1) + f.bbox(3), h.bbox(1) + h.bbox(3)) - max(f.bbox(1), h.bbox(1)));
                yOverlap = max(0, min(f.bbox(2) + f.bbox(4), h.bbox(2) + h.bbox(4)) - max(f.bbox(2), h.bbox(2)));
                if (xOverlap > 0) && (yOverlap > 0)
                    hasOverlap = true;
                end
            end
        end
    else
        minDist = 0;
    end
    
    supported = hasOverlap || (attStrength >= 0.35);
    
    % 3. ANATOMICAL CONTEXT COMPUTATION
    anatContext = 'Peripheral Retina';
    if ~isempty(mac) && isfield(mac, 'estimated') && mac.estimated && ~isnan(mac.centerX)
        distMac = sqrt((fx - mac.centerX)^2 + (fy - mac.centerY)^2);
        if distMac <= (mac.radius * 2.0)
            anatContext = 'Macular Vicinity / Central Foveal Zone';
        end
    end
    
    if strcmp(anatContext, 'Peripheral Retina') && ~isempty(od) && isfield(od, 'detected') && od.detected && ~isnan(od.centerX)
        distOD = sqrt((fx - od.centerX)^2 + (fy - od.centerY)^2);
        if distOD <= (od.radius * 2.0)
            anatContext = 'Peripapillary Retinal Region';
        end
    end
    
    if strcmp(anatContext, 'Peripheral Retina') && ~isempty(rf) && isfield(rf, 'detected') && rf.detected
        distRetCenter = sqrt((fx - rf.centerX)^2 + (fy - rf.centerY)^2);
        retRad = min(rf.radiusX, rf.radiusY);
        if distRetCenter <= (retRad * 0.45)
            anatContext = 'Posterior Retinal Pole';
        else
            if fy < rf.centerY - 0.20 * H
                anatContext = 'Superior Retinal Quadrant';
            elseif fy > rf.centerY + 0.20 * H
                anatContext = 'Inferior Retinal Quadrant';
            elseif fx < rf.centerX
                anatContext = 'Temporal / Nasal Hemifield 1';
            else
                anatContext = 'Nasal / Temporal Hemifield 2';
            end
        end
    end
    
    evidenceRegions(i).candidateId = f.id;
    evidenceRegions(i).candidateType = f.type;
    evidenceRegions(i).attentionOverlap = hasOverlap;
    evidenceRegions(i).nearestHotspotId = nearestId;
    evidenceRegions(i).distanceToNearestHotspot = round(minDist, 1);
    evidenceRegions(i).normalizedDistance = round(minDist / max(W, H), 4);
    evidenceRegions(i).attentionStrength = round(attStrength, 4);
    evidenceRegions(i).supportedByModelAttention = supported;
    evidenceRegions(i).anatomicalContext = anatContext;
    evidenceRegions(i).source = 'image_processing';
    evidenceRegions(i).status = 'candidate';
end

end
