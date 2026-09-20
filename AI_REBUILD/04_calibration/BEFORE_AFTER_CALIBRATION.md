# RetinoScan AI — Before & After Calibration Benchmark

**Frozen Model:** `R18-FINAL-CANDIDATE` (`trained_dr_model_r18_final_candidate.mat`)
**Fitting Partition:** Canonical CALIBRATION Split ONLY (N = 550 retinal fundus images)
**Optimal Temperature Parameter:** T* = `1.8063`

## 1. Multi-Class Calibration Metrics

| Metric | Raw Softmax (T = 1.0) | Calibrated (T = 1.8063) | Relative Improvement |
| :--- | :---: | :---: | :---: |
| **Expected Calibration Error (ECE, 10 bins)** | **0.0900** (9.00%) | **0.0345** (3.45%) | **-61.7% calibration error reduction** |
| **Multi-Class Brier Score** | **0.3131** | **0.2939** | **-6.12% probability score accuracy** |
| **Log Loss (Negative Log-Likelihood)** | **0.6287** | **0.5473** | **-12.95% cross-entropy reduction** |
| **Mean Top-1 Confidence** | 86.94% | 78.51% | Aligned with empirical accuracy (79.09%) |
| **Classification Accuracy** | 79.09% | 79.09% | 0.00% (Argmax strictly invariant) |

## 2. Reliability Diagram Overview

- **Raw Softmax (`reliability_raw.png`):** Exhibited classical overconfidence (mean confidence 86.94% vs true accuracy 79.09%), with large gaps above the perfect calibration diagonal.
- **Temperature Scaled (`reliability_calibrated.png`):** Centers confidence estimates directly along the identity diagonal, eliminating overconfidence while preserving exact ordinal rank order.

## 3. Calibrated Referable Risk Operating Points (Calibration Split)

Continuous Risk Formulation: $$P(\text{Referable}) = P(\text{Grade 2}) + P(\text{Grade 3}) + P(\text{Grade 4})$$

| Operating Threshold ($\tau$) | Referable Sensitivity | Referable Specificity | Precision | F1-Score | Diagnostic Accuracy |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **0.10** | 98.21% | 88.99% | 85.88% | 0.9163 | 92.73% |
| **0.15** | 95.96% | 90.21% | 86.99% | 0.9126 | 92.55% |
| **0.20** | 95.07% | 92.05% | 89.08% | 0.9197 | 93.27% |
| **0.25** | 93.27% | 92.97% | 90.04% | 0.9163 | 93.09% |
| **0.30** | 91.93% | 95.11% | 92.76% | 0.9234 | 93.82% |
| **0.35** | 91.03% | 95.72% | 93.55% | 0.9227 | 93.82% |
| **0.40** | 88.34% | 96.02% | 93.81% | 0.9099 | 92.91% |
| **0.45** | 87.89% | 96.33% | 94.23% | 0.9095 | 92.91% |
| **0.50** | 84.30% | 96.33% | 94.00% | 0.8889 | 91.45% |
| **0.55** | 81.61% | 97.55% | 95.79% | 0.8814 | 91.09% |
| **0.60** | 78.03% | 97.86% | 96.13% | 0.8614 | 89.82% |
| **0.65** | 73.99% | 98.17% | 96.49% | 0.8376 | 88.36% |
| **0.70** | 68.61% | 98.17% | 96.23% | 0.8010 | 86.18% |
| **0.75** | 64.13% | 98.47% | 96.62% | 0.7709 | 84.55% |
| **0.80** | 59.64% | 99.08% | 97.79% | 0.7409 | 83.09% |
| **0.85** | 52.02% | 99.69% | 99.15% | 0.6824 | 80.36% |
| **0.90** | 43.50% | 100.00% | 100.00% | 0.6062 | 77.09% |
