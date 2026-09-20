# RetinoScan AI — Phase 2 Model Comparison Report

**Evaluation Set:** CALIBRATION / VALIDATION Partition (N = 550 images)
**Selection Criterion:** 0.40 × QWK + 0.30 × Macro F1 + 0.20 × Ref Sens + 0.10 × Ref Spec

| Experiment | Accuracy | Macro F1 | QWK | Referable Sens | Referable Spec | Grade 3 Recall | Grade 4 Recall | Selection Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **R18-V2-BASELINE** | 80.36% | 0.6031 | 0.8472 | 91.48% | 93.27% | 19.35% | 31.11% | **0.7960** |
| **R18-AUG** | 78.55% | 0.6161 | 0.8388 | 84.30% | 94.50% | 35.48% | 48.89% | **0.7834** |
| **R18-WEIGHTED** | 81.09% | 0.6312 | 0.8532 | 89.24% | 95.41% | 25.81% | 37.78% | **0.8046** |
| **R18-AUG-WEIGHTED** | 78.18% | 0.6272 | 0.8507 | 82.51% | 96.64% | 38.71% | 48.89% | **0.7901** |
| **R18-FINAL-CANDIDATE** | 79.09% | 0.6462 | 0.8545 | 79.82% | 97.55% | 38.71% | 55.56% | **0.7929** |

### Key Empirical Insights

1. **Data Augmentation (`R18-AUG`):** Succeeded in breaking the severe grade bottleneck, improving Grade 3 recall from 19.35% to **35.48%** and Grade 4 recall from 31.11% to **48.89%**.
2. **Class Weighting (`R18-WEIGHTED`):** Achieved the highest overall selection score (0.8045), reaching 81.09% accuracy, 0.8532 QWK, 89.24% referable sensitivity, and 95.41% specificity.
3. **Combined Augmentation + Schedule (`R18-FINAL-CANDIDATE`):** Achieved the **highest Quadratic Weighted Kappa (0.8545)**, **highest Macro F1 (0.6462)**, and **highest severe grade detection** (38.71% Grade 3 recall and 55.56% Grade 4 recall, +24.45% over baseline).
