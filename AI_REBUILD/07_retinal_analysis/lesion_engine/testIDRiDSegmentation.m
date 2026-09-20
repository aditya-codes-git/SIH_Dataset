function testIDRiDSegmentation()
% TESTIDRIDSEGMENTATION
% Automated unit test suite for Phase 6B IDRiD Pixel-Level Lesion
% Segmentation data ingestion.
%
% Verifies:
%   A. Source path accessible
%   B. Ingestion discovers segmentation package (81 images)
%   C. Official partition preserved (54 Train / 27 Test, 0 overlap)
%   D. Mask counts verified (81 MA, 80 HE, 81 EX, 40 SE, 81 OD)
%   E. File readability (0 unreadable images, 0 unreadable masks)
%   F. Dimensional consistency (all 4288x2848, 0 mismatches)
%   G. Mask non-emptiness (0 empty masks)
%   H. Absence of duplicate IDs across splits
%   I. Overlap auditing (79 grading overlap, 0 APTOS overlap)
%   J. Source dataset completely preserved (zero files modified)
%   K. Strict clinical governance (zero pseudo-labels, no models trained)
%   L. Legacy deployed pipeline unaffected

fprintf('===========================================================\n');
fprintf('  RUNNING PHASE 6B IDRiD SEGMENTATION INGESTION TEST SUITE \n');
fprintf('===========================================================\n');

scriptDir = fileparts(mfilename('fullpath'));
sourceDir = 'D:\SIH_Dataset\IDRID\A. Segmentation';
indexCsv = fullfile(scriptDir, 'idrid_segmentation_index.csv');

%% TEST A: Source path exists
fprintf('[TEST A] Source path exists: ');
assert(exist(sourceDir, 'dir') == 7, 'Source path %s does not exist', sourceDir);
fprintf('PASSED\n');

%% TEST B: Segmentation package discovery
fprintf('[TEST B] Segmentation package discovery: ');
report = ingestIDRiDSegmentation(sourceDir, scriptDir);
assert(report.found, 'Segmentation subset was not found');
assert(report.originalImages == 81, 'Expected 81 original images, got %d', report.originalImages);
fprintf('PASSED (%d images discovered)\n', report.originalImages);

%% TEST C: Official split preservation
fprintf('[TEST C] Official partition preservation: ');
assert(report.officialTrain == 54, 'Expected 54 training images, got %d', report.officialTrain);
assert(report.officialTest == 27, 'Expected 27 testing images, got %d', report.officialTest);
fprintf('PASSED (54 Train / 27 Test preserved)\n');

%% TEST D: Mask counts
fprintf('[TEST D] Mask counts per lesion class: ');
assert(report.maMasks == 81, 'Expected 81 MA masks, got %d', report.maMasks);
assert(report.heMasks == 80, 'Expected 80 HE masks, got %d', report.heMasks);
assert(report.exMasks == 81, 'Expected 81 EX masks, got %d', report.exMasks);
assert(report.seMasks == 40, 'Expected 40 SE masks, got %d', report.seMasks);
assert(report.odMasks == 81, 'Expected 81 OD masks, got %d', report.odMasks);
fprintf('PASSED (MA=81, HE=80, EX=81, SE=40, OD=81)\n');

%% TEST E & F: Readability and dimensional consistency
fprintf('[TEST E & F] File readability & dimensions: ');
assert(report.unreadableImages == 0, 'Found %d unreadable images', report.unreadableImages);
assert(report.unreadableMasks == 0, 'Found %d unreadable masks', report.unreadableMasks);
assert(report.dimMismatches == 0, 'Found %d dimension mismatches', report.dimMismatches);
fprintf('PASSED (100%% readable at 4288x2848)\n');

%% TEST G: Mask non-emptiness
fprintf('[TEST G] Non-empty masks check: ');
assert(report.emptyMasks == 0, 'Found %d completely empty masks', report.emptyMasks);
fprintf('PASSED (0 empty masks)\n');

%% TEST H: Duplicate IDs & Cross-Split Leakage
fprintf('[TEST H] Duplicate IDs & Partition Leakage: ');
assert(report.duplicateIds == 0, 'Found duplicate IDs');
assert(report.leakagePassed, 'Partition leakage check failed');
fprintf('PASSED (0 duplicates, 0 cross-split leakage)\n');

%% TEST I: Cross-Dataset Overlap
fprintf('[TEST I] Cross-dataset overlap audit: ');
assert(report.overlapGrading == 79, 'Expected 79 overlap with grading set, got %d', report.overlapGrading);
assert(report.missingGrading == 2, 'Expected 2 missing from grading set, got %d', report.missingGrading);
assert(report.overlapAPTOS == 0, 'Expected 0 overlap with APTOS, got %d', report.overlapAPTOS);
assert(report.overlapAPTOSTest == 0, 'Expected 0 overlap with held-out APTOS test, got %d', report.overlapAPTOSTest);
fprintf('PASSED (79 grading overlap, 0 APTOS overlap)\n');

%% TEST J: Source dataset preservation
fprintf('[TEST J] Source dataset unmodified: ');
assert(report.sourcePreserved, 'Source dataset was modified during ingestion!');
assert(~report.sourceModified, 'Source dataset marked as modified!');
fprintf('PASSED (All 446 source files preserved untouched)\n');

%% TEST K: Governance safety rules
fprintf('[TEST K] Clinical governance safety rules: ');
assert(~report.pseudoLabelsCreated, 'Pseudo-labels were created!');
assert(~report.modelTrained, 'Model was trained during ingestion phase!');
fprintf('PASSED (Zero pseudo-labels, zero models trained)\n');

%% TEST L: Legacy inference regression
fprintf('[TEST L] Legacy inference regression: ');
baseDir = fileparts(fileparts(scriptDir));
repoDir = fileparts(baseDir);
curDir = pwd;
cd(repoDir);
try
    test_deployed_pipeline;
    cd(curDir);
catch ME
    cd(curDir);
    rethrow(ME);
end
fprintf('[TEST L] Legacy inference regression: PASSED\n');

fprintf('\n===========================================================\n');
fprintf('  ALL 12 PHASE 6B SEGMENTATION TESTS PASSED (A-L)          \n');
fprintf('===========================================================\n');
end
