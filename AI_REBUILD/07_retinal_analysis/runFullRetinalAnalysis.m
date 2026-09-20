function analysis = runFullRetinalAnalysis(imgInput, outDir, varargin)
% RUNFULLRETINALANALYSIS
% Master orchestrator for Phase 5 Retinal Anatomical Analysis & Candidate Evidence Engine.
%
% Produces structured clinical findings and separate visual assets:
%   1. original_fundus.png
%   2. gradcam_overlay.png
%   3. attention_points.png
%   4. retinal_landmarks.png
%   5. retinal_analysis.png
%   6. retinal_analysis.json
%
% Usage:
%   analysis = runFullRetinalAnalysis(imgPath, outDir)

p = inputParser;
addRequired(p, 'imgInput');
addRequired(p, 'outDir');
addParameter(p, 'ModelFile', fullfile(fileparts(fileparts(mfilename('fullpath'))), '02_training', 'models', 'trained_dr_model_r18_final_candidate.mat'), @ischar);
addParameter(p, 'Prefix', '', @ischar);
parse(p, imgInput, outDir, varargin{:});

baseDir = fileparts(fileparts(mfilename('fullpath'))); % AI_REBUILD/
addpath(fullfile(baseDir, '06_explainability'));
addpath(fullfile(baseDir, '07_retinal_analysis'));
addpath(fullfile(baseDir, '04_calibration'));
addpath(fullfile(baseDir, '02_training'));

if ~exist(outDir, 'dir'), mkdir(outDir); end

prefix = p.Results.Prefix;
if ~isempty(prefix) && ~endsWith(prefix, '_')
    prefix = [prefix, '_'];
end

if ischar(imgInput) || isstring(imgInput)
    origImg = imread(char(imgInput));
else
    origImg = imgInput;
end

% 1. RETINAL FIELD SEGMENTATION
rf = segmentRetinalField(origImg);

% 2. OPTIC DISC DETECTION
od = detectOpticDisc(origImg, 'RetinalField', rf);

% 3. MACULA ESTIMATION
mac = estimateMacula(origImg, 'OpticDisc', od, 'RetinalField', rf);

% 4. VESSEL ARCHITECTURE EXTRACTION
vesselMaskPath = fullfile(outDir, sprintf('%svessel_mask.png', prefix));
vessels = analyzeRetinalVessels(origImg, 'RetinalField', rf, 'OutputPath', vesselMaskPath);

% 5. CANDIDATE ABNORMAL REGION EXTRACTION
findings = extractCandidateFindings(origImg, 'RetinalField', rf, 'OpticDisc', od, 'Vessels', vessels);

% 6. MULTI-SCALE GRAD-CAM ATTENTION HOTSPOTS
gradRes = generateImprovedGradCAM(origImg, 'ModelFile', p.Results.ModelFile, 'Strategy', 'MultiScaleFusion');
[hotspots, ~] = extractAttentionHotspots(gradRes.heatmap, gradRes.retinalMask, 'TopK', 6);

% 7. CROSS-REFERENCE EVIDENCE REGIONS
evidence = matchEvidenceRegions(findings, hotspots, gradRes.heatmap, ...
    'OpticDisc', od, 'Macula', mac, 'RetinalField', rf);

% 8. EXPORT DISCRETE VISUAL ASSETS
% A. Original Fundus
origPath = fullfile(outDir, sprintf('%soriginal_fundus.png', prefix));
imwrite(uint8(gradRes.originalImage * 255), origPath);

% B. Grad-CAM Overlay
overlayPath = fullfile(outDir, sprintf('%sgradcam_overlay.png', prefix));
imwrite(uint8(gradRes.overlayImage * 255), overlayPath);

% C. Attention Points
ptsPath = fullfile(outDir, sprintf('%sattention_points.png', prefix));
renderAttentionPoints(gradRes.overlayImage, hotspots, 'OutputPath', ptsPath);

% D. Retinal Landmarks (Optic Disc + Macula + Field)
landmarksPath = fullfile(outDir, sprintf('%sretinal_landmarks.png', prefix));
renderRetinalAnalysis(origImg, rf, od, mac, struct([]), struct([]), 'OutputPath', landmarksPath);

% E. Full Retinal Analysis Composite
analysisImgPath = fullfile(outDir, sprintf('%sretinal_analysis.png', prefix));
renderRetinalAnalysis(origImg, rf, od, mac, findings, hotspots, 'OutputPath', analysisImgPath);

% 9. PACK STRUCTURED RESULT
retinalAnalysis = struct();
retinalAnalysis.retinalField = struct(...
    'detected', rf.detected, ...
    'centerX', rf.centerX, ...
    'centerY', rf.centerY, ...
    'radiusX', rf.radiusX, ...
    'radiusY', rf.radiusY, ...
    'bbox', rf.bbox, ...
    'coverageRatio', rf.coverageRatio);

retinalAnalysis.opticDisc = struct(...
    'detected', od.detected, ...
    'centerX', od.centerX, ...
    'centerY', od.centerY, ...
    'radius', od.radius, ...
    'bbox', od.bbox, ...
    'algorithmicConfidence', od.algorithmicConfidence);

retinalAnalysis.macula = struct(...
    'estimated', mac.estimated, ...
    'centerX', mac.centerX, ...
    'centerY', mac.centerY, ...
    'radius', mac.radius, ...
    'algorithmicConfidence', mac.algorithmicConfidence, ...
    'method', mac.method);

retinalAnalysis.vessels = struct(...
    'available', vessels.available, ...
    'vesselAreaRatio', vessels.vesselAreaRatio, ...
    'branchDensity', vessels.branchDensity, ...
    'method', vessels.method, ...
    'maskPath', vesselMaskPath);

retinalAnalysis.candidateFindings = findings;
retinalAnalysis.evidenceRegions = evidence;
retinalAnalysis.hotspots = hotspots;

retinalAnalysis.assets = struct(...
    'originalFundus', origPath, ...
    'gradcamOverlay', overlayPath, ...
    'attentionPoints', ptsPath, ...
    'retinalLandmarks', landmarksPath, ...
    'retinalAnalysis', analysisImgPath);

retinalAnalysis.disclaimer = 'Candidate findings and attention hotspots represent unsupervised image-processing saliency and neural visual attention. They do not constitute validated microscopic lesion diagnoses (microaneurysms, hemorrhages, or exudates).';

% Save JSON
jsonPath = fullfile(outDir, sprintf('%sretinal_analysis.json', prefix));
fid = fopen(jsonPath, 'w');
fprintf(fid, '%s', jsonencode(retinalAnalysis));
fclose(fid);

analysis = retinalAnalysis;
analysis.metadataFile = jsonPath;

end
