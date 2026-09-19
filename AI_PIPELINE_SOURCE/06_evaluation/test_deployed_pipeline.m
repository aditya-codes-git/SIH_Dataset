function test_deployed_pipeline()
% TEST_DEPLOYED_PIPELINE
% Direct MATLAB verification of the deployed drScreen.m pipeline:
% 1. Regression test on Grade-2 APTOS image 000c1434d8d7.png
% 2. Ungradable hard gate test on dark/blurred image
% 3. Test on another real APTOS image
% 4. Data consistency check against processed_train_images/

disp('===========================================================');
disp('        TESTING DEPLOYED MATLAB INFERENCE PIPELINE         ');
disp('===========================================================');

%% 1. Regression Test on Grade-2 Image 000c1434d8d7.png
imgFile1 = fullfile('train_images', '000c1434d8d7.png');
img1 = imread(imgFile1);

disp('1. Testing Grade-2 APTOS image (000c1434d8d7.png)...');
res1 = drScreen(img1);

disp(['   Status:     ', char(res1.status)]);
disp(['   Grade:      ', num2str(res1.grade)]);
disp(['   Confidence: ', num2str(res1.confidence * 100, '%.2f'), '%']);
disp(['   Referable:  ', num2str(res1.referable)]);
disp(['   Referral:   ', char(res1.referral)]);
disp(['   ScoreMap:   ', num2str(size(res1.scoreMap))]);

assert(res1.status == "GRADABLE", 'Status must be GRADABLE');
assert(res1.grade == 2, 'Grade must be 2');
assert(res1.referable == true, 'Referable must be true');

%% 2. Ungradable Hard Gate Test
disp(' ');
disp('2. Testing UNGRADABLE image (solid black image)...');
blackImg = zeros(300, 300, 3, 'uint8');
res2 = drScreen(blackImg);

disp(['   Status:  ', char(res2.status)]);
disp(['   Message: ', char(res2.message)]);
disp(['   Reason:  ', char(res2.quality.reason)]);

assert(res2.status == "UNGRADABLE", 'Status must be UNGRADABLE');
assert(~isfield(res2, 'grade'), 'Grade field must not exist for UNGRADABLE image');

%% 3. Test Second Real APTOS Image
data = readtable('train.csv', 'TextType', 'string');
sample2 = data.id_code(10);
imgFile3 = fullfile('train_images', [char(sample2), '.png']);
img3 = imread(imgFile3);

disp(' ');
disp(['3. Testing second APTOS image (', char(sample2), '.png)...']);
res3 = drScreen(img3);

disp(['   Status:     ', char(res3.status)]);
disp(['   Grade:      ', num2str(res3.grade)]);
disp(['   Confidence: ', num2str(res3.confidence * 100, '%.2f'), '%']);
disp(['   Referable:  ', num2str(res3.referable)]);
disp(['   Referral:   ', char(res3.referral)]);

assert(res3.status == "GRADABLE", 'Status must be GRADABLE');
assert(res3.confidence >= 0 && res3.confidence <= 1.0, 'Confidence must be in [0, 1]');

%% 4. Data Consistency Check
disp(' ');
disp('4. Verifying inference preprocessing consistency with processed_train_images/...');
preInference = preprocessFundusKaggle(img1, [224 224]);
savedDisk = imread(fullfile('processed_train_images', '000c1434d8d7.png'));

diffMap = double(preInference) - double(savedDisk);
maxDiff = max(abs(diffMap(:)));

disp(['   Max Pixel Difference: ', num2str(maxDiff)]);
assert(maxDiff <= 2, 'Preprocessing during inference must match processed_train_images/ within 2 pixel intensities');

disp(' ');
disp('===========================================================');
disp('          ALL MATLAB DIRECT PIPELINE TESTS PASSED           ');
disp('===========================================================');

end
