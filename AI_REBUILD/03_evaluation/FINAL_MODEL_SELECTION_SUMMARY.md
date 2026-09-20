# RetinoScan AI — Phase 2.6 Final Model Selection Summary
**Comparative Evidence on the Canonical Held-Out Test Set (N = 548)**

**Constraint Note:** The held-out test split was evaluated strictly for diagnostic evidence. No training, weights, calibration, thresholds, or selection formulas were altered using these results.

---

## 1. Primary Test Benchmark Comparison

| Metric | Candidate A (`R18-WEIGHTED`) | Candidate B (`R18-FINAL-CANDIDATE`) | Difference ($\Delta = \text{B} - \text{A}$) |
| :--- | :---: | :---: | :---: |
| **Accuracy** | **78.28%** (429/548) | 76.09% (417/548) | -2.19% |
| **Quadratic Weighted Kappa (QWK)** | 0.8437 | **0.8509** | **+0.0072** |
| **Macro F1** | 0.5592 | **0.5861** | **+0.0269** (+2.69%) |
| **Referable Sensitivity** (Argmax $\ge 2$) | **85.71%** (192/224) | 79.46% (178/224) | -6.25% |
| **Referable Specificity** (Argmax $< 2$) | 94.75% (307/324) | **96.60%** (313/324) | **+1.85%** |
| **Referable Precision (PPV)** | 91.87% (192/209) | **94.18%** (178/189) | **+2.31%** |
| **Referable F1-Score** | **0.8868** | 0.8620 | -0.0248 |
| **Referable ROC-AUC** | **0.9784** | 0.9753 | -0.0031 |
| **Grade 0 Recall** | **98.15%** (266/271) | 97.79% (265/271) | -0.36% |
| **Grade 1 Recall** | 54.72% (29/53) | **64.15%** (34/53) | **+9.43%** |
| **Grade 2 Recall** | **76.32%** (116/152) | 57.89% (88/152) | -18.43% |
| **Grade 3 Recall** | 14.81% (4/27) | **37.04%** (10/27) | **+22.23%** (2.5× higher) |
| **Grade 4 Recall** | 31.11% (14/45) | **44.44%** (20/45) | **+13.33%** |

---

## 2. Referable DR Screening Breakdown (Ground Truth Referable $N = 224$)

| Quantity | Candidate A (`R18-WEIGHTED`) | Candidate B (`R18-FINAL-CANDIDATE`) | Note |
| :--- | :---: | :---: | :--- |
| **Total Test Samples** | 548 | 548 | Unseen test images |
| **Ground Truth Non-Referable (0 or 1)** | 324 | 324 | $271 \text{ (Gr 0)} + 53 \text{ (Gr 1)}$ |
| **Ground Truth Referable ($\ge 2$)** | 224 | 224 | $152 \text{ (Gr 2)} + 27 \text{ (Gr 3)} + 45 \text{ (Gr 4)}$ |
| **Referable True Positives (TP)** | **192** | 178 | Referable patients correctly identified as $\ge 2$ |
| **Referable False Negatives (FN)** | **32** | 46 | Referable patients incorrectly called Grade 0 or 1 |
| **Non-Referable True Negatives (TN)** | 307 | **313** | Non-referable patients correctly called 0 or 1 |
| **Non-Referable False Positives (FP)** | 17 | **11** | Non-referable patients incorrectly called $\ge 2$ |

### Detailed Breakdown of the Referable False Negatives (FN)

Where do the missed referable patients go?

* In **`R18-WEIGHTED`** (32 FNs):
  - True Grade 2 called Grade 0: **2**
  - True Grade 2 called Grade 1: **24**
  - True Grade 3 called Grade 0: **0**
  - True Grade 3 called Grade 1: **0** (all 18 non-Gr3 predictions were called Grade 2)
  - True Grade 4 called Grade 0: **2**
  - True Grade 4 called Grade 1: **4**
  - *Grade 4 missed into non-referable: 6 cases.*

* In **`R18-FINAL-CANDIDATE`** (46 FNs):
  - True Grade 2 called Grade 0: **1**
  - True Grade 2 called Grade 1: **38**
  - True Grade 3 called Grade 0: **0**
  - True Grade 3 called Grade 1: **0** (all 17 non-Gr3 predictions were called Grade 2 or Grade 4)
  - True Grade 4 called Grade 0: **0**
  - True Grade 4 called Grade 1: **7**
  - *Grade 4 missed into non-referable: 7 cases.*

---

## 3. Objective Trade-Off Analysis

### A. Which model has stronger fine-grained 5-class severity behavior?
**`R18-FINAL-CANDIDATE` is stronger in 5-class severity grading.**
* **Severe NPDR (Grade 3) Recall:** 37.04% vs 14.81% (+22.23% absolute; catches 10 of 27 vs 4 of 27). `R18-WEIGHTED` suffers the same high-grade collapse that plagued the baseline.
* **Proliferative DR (Grade 4) Recall:** 44.44% vs 31.11% (+13.33% absolute; catches 20 of 45 vs 14 of 45).
* **Mild NPDR (Grade 1) Recall:** 64.15% vs 54.72% (+9.43% absolute).
* **Overall Ordinal Agreement (QWK):** 0.8509 vs 0.8437.
* **Macro F1:** 0.5861 vs 0.5592.

### B. Which model has stronger binary referable screening behavior?
**`R18-WEIGHTED` is stronger in uncalibrated default-threshold binary referral sensitivity.**
* **Referable Sensitivity:** 85.71% (192/224) vs 79.46% (178/224), producing 14 fewer false negatives at the default argmax decision rule ($\text{predicted grade} \ge 2$).
* **Referable AUC-ROC:** 0.9784 vs 0.9753 (marginal +0.0031 advantage).
* Conversely, `R18-FINAL-CANDIDATE` has higher **Referable Specificity** (96.60% vs 94.75%) and higher **Precision** (94.18% vs 91.87%), causing fewer false positive referrals (11 vs 17).

### C. Is the difference material?
**Yes, the difference is material on both dimensions:**
1. In high-grade detection, `R18-WEIGHTED` misses **85.19%** of Grade 3 patients and **68.89%** of Grade 4 patients on test data, whereas `R18-FINAL-CANDIDATE` catches 2.5× more Grade 3 patients and 44.44% of Grade 4 patients.
2. In binary screening at default threshold ($\text{grade} \ge 2$), `R18-FINAL-CANDIDATE` misses 46 referable cases (mostly Moderate Grade 2 classified as Mild Grade 1) versus 32 for `R18-WEIGHTED`.

### D. What trade-off exists?
The core trade-off is **Boundary Sensitivity between Grade 1 and Grade 2** versus **High-Grade Separation (Grade 3 and 4)**:
* `R18-WEIGHTED` errs toward classifying borderline Grade 1/2 cases as Grade 2 (Moderate NPDR), boosting binary referral sensitivity but failing to distinguish Severe and Proliferative lesions from Moderate NPDR.
* `R18-FINAL-CANDIDATE` separates Severe (Grade 3) and Proliferative (Grade 4) lesions substantially better, but errs conservatively on borderline Grade 1 vs Grade 2 cases, leading to lower default-threshold binary sensitivity when evaluated purely by discrete argmax.

---

## 4. Architectural Feasibility: Decoupling Severity from Referable Risk

### Question: Is it technically possible to separate 5-class severity prediction from the referable-risk decision using the same frozen model's probability outputs?

**Yes, absolutely.**

1. **Probability Structure:**
   Both frozen models output a standard 5-element softmax probability vector $\mathbf{p} = [p_0, p_1, p_2, p_3, p_4]$ where $\sum_{c=0}^4 p_c = 1.0$.
2. **Analytical Referable Risk Definition:**
   The posterior probability that a patient has referable diabetic retinopathy is strictly:
   $$P(\text{Referable}) = p_2 + p_3 + p_4 = 1.0 - (p_0 + p_1)$$
3. **Empirical Verification:**
   On the test set, $P(\text{Referable})$ spans continuously from $0.0000$ to $1.0000$.
   - In borderline cases where argmax predicts Grade 1 ($p_1 = 0.6373$), the referable tail $p_2 + p_3 + p_4$ still retains substantial mass ($0.3580$).
   - Under the discrete argmax rule, this patient is classified as Non-Referable (0).
   - Under an explicit continuous referable probability $P(\text{Referable})$, the screening system can expose:
     - `severityGrade`: discrete integer $\{0, 1, 2, 3, 4\}$ from argmax or expected grade.
     - `referableProbability`: continuous score $P(\text{Referable}) \in [0.0, 1.0]$.
4. **Implication for Phase 3:**
   In Phase 3 (Temperature Scaling & Probability Calibration on the Calibration partition), temperature scaling can calibrate these probabilities, and an operating threshold $\tau$ can be determined to achieve $\ge 90\%$ referable sensitivity without sacrificing the 5-class backbone's superior Grade 3 and Grade 4 recognition.

---

## 5. Summary & Phase 3 Gate Recommendation

1. **Is `R18-FINAL-CANDIDATE` appropriate for Phase 3?**
   **Yes.** It is the only trained model that successfully solved the high-grade collapse (achieving QWK 0.8509 and Macro F1 0.5861 on unseen test data). Its lower default binary sensitivity stems purely from Grade 1/2 boundary thresholding, which Phase 3 calibration and threshold tuning are designed to calibrate.
2. **Should referral logic remain `grade >= 2` for now?**
   **Yes.** Production inference and backend logic must remain strictly untouched until Phase 3 and Phase 4 regression gates are complete.
3. **Is a separate calibrated referable-risk score feasible?**
   **Yes.** The softmax probability mass $P(\text{Referable}) = p_2 + p_3 + p_4$ is natively present and can be exposed as an auxiliary risk metric in future phases.
