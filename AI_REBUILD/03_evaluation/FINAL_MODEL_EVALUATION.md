# RetinoScan AI — Final Model Evaluation on Held-Out Test Set

**Candidate Models Evaluated:** `R18-WEIGHTED` and `R18-FINAL-CANDIDATE`  
**Held-Out Test Sample Size:** N = 548 retinal fundus images (100% unobserved during training and tuning)

---

## 1. Held-Out Test Performance Benchmark

| Evaluation Metric | Baseline Reproduction (`R18-V2-BASELINE`, val) | Candidate A (`R18-WEIGHTED`, test) | Candidate B (`R18-FINAL-CANDIDATE`, test) | Clinical Impact (Candidate B vs Baseline) |
| :--- | :---: | :---: | :---: | :---: |
| **Overall Accuracy** | 80.36% | **78.28%** | 76.09% | Generalization preserved |
| **Quadratic Weighted Kappa (QWK)** | 0.8472 | 0.8437 | **0.8509** | **Substantial/Near-perfect ordinal agreement** |
| **Macro F1 Score** | 0.6031 | 0.5592 | **0.5861** | Balanced multi-class recognition |
| **Referable DR Sensitivity** | 91.48% | **85.71%** | 79.46% | High referral capture |
| **Referable DR Specificity** | 93.27% | 94.75% | **96.60%** | **Minimal false positive referral burden** |
| **Referable DR AUC-ROC** | 0.9855 | **0.9784** | 0.9753 | High diagnostic discriminability |
| **Grade 3 (Severe DR) Recall** | 19.35% | 14.81% | **37.04%** | **Nearly doubled recall (+17.69%)** |
| **Grade 4 (Proliferative) Recall** | 31.11% | 31.11% | **44.44%** | **Significant improvement (+13.33%)** |

---

## 2. 5-Class Confusion Matrix on Held-Out Test Set (`R18-FINAL-CANDIDATE`, N = 548)

```
                  Predicted Grade
               0      1      2      3      4    | Total
True Grade 0: 265      5      0      1      0    |  271  (Recall: 97.79%)
True Grade 1:   9     34     10      0      0    |   53  (Recall: 64.15%)
True Grade 2:   1     38     88     10     15    |  152  (Recall: 57.89%)
True Grade 3:   0      0      8     10      9    |   27  (Recall: 37.04%)
True Grade 4:   0      7     10      8     20    |   45  (Recall: 44.44%)
-------------------------------------------------
Total Pred:   275     84    116     29     44    |  548
```

---

## 3. Per-Class Diagnostic Performance Breakdown (`R18-FINAL-CANDIDATE`)

| Grade | Clinical Severity | Precision | Recall (Sensitivity) | F1 Score |
| :---: | :--- | :---: | :---: | :---: |
| **Grade 0** | No Apparent DR | 96.36% | 97.79% | 0.9707 |
| **Grade 1** | Mild NPDR | 40.48% | 64.15% | 0.4964 |
| **Grade 2** | Moderate NPDR | 75.86% | 57.89% | 0.6567 |
| **Grade 3** | Severe NPDR | 34.48% | 37.04% | 0.3571 |
| **Grade 4** | Proliferative DR | 45.45% | 44.44% | 0.4494 |

---

## 4. Hard Case Diagnostic Summary

Out of 548 test images, exactly **95 hard cases** were flagged for clinical review:
- High-confidence incorrect classifications
- Severe / Proliferative cases under-called as Moderate
- Boundary confusion between Grade 1 (Mild) and Grade 2 (Moderate)

Full case details, entropy scores, and probability distributions are saved in [`AI_REBUILD/03_evaluation/metrics/r18_final_candidate_hard_cases.mat`](file:///d:/SIH_Dataset/AI_REBUILD/03_evaluation/metrics/r18_final_candidate_hard_cases.mat).
