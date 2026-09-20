function test_computeQWK()
% TEST_COMPUTEQWK
% Verifies computeQWK against known ground truth scenarios.

% 1. Perfect Agreement
yTrue1 = [0 1 2 3 4 0 1 2 3 4];
yPred1 = [0 1 2 3 4 0 1 2 3 4];
k1 = computeQWK(yTrue1, yPred1, 5);
fprintf('Test 1 (Perfect agreement): QWK = %.4f (Expected: 1.0000)\n', k1);
assert(abs(k1 - 1.0) < 1e-6, 'QWK should be 1.0 for perfect agreement');

% 2. Known Manual Example (4 samples)
% Let true = [0 1 2 3], pred = [0 1 2 2]
% Only one mild error (3 predicted as 2, diff = 1)
yTrue2 = [0 1 2 3];
yPred2 = [0 1 2 2];
k2 = computeQWK(yTrue2, yPred2, 5);
fprintf('Test 2 (Single grade adjacent error): QWK = %.4f\n', k2);
assert(k2 > 0.8 && k2 < 1.0, 'QWK should be high positive for near-perfect agreement');

% 3. Completely Inverted (Worse than chance)
yTrue3 = [0 0 0 4 4 4];
yPred3 = [4 4 4 0 0 0];
k3 = computeQWK(yTrue3, yPred3, 5);
fprintf('Test 3 (Completely inverted): QWK = %.4f\n', k3);
assert(k3 < 0, 'QWK should be negative for systematic opposite predictions');

fprintf('===========================================================\n');
fprintf('           COMPUTEQWK VERIFICATION PASSED                 \n');
fprintf('===========================================================\n');

end
