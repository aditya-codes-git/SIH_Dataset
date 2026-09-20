# RetinoScan AI — Phase 2.5 Model Selection Audit
**Formal Audit of Model Selection Score, Validation Metrics, and Candidate Resolution**

**Date:** 2026-09-20  
**Scope:** Strictly validation/calibration partition ($N = 550$). Zero held-out test data was used to decide or alter this audit. No models were retrained.

---

## 1. Exact Selection-Score Formula & Code Trace

The `Selection Score` displayed in Phase 2 documentation originated from lines 49–53 of [`AI_REBUILD/03_evaluation/finalize_phase2_evaluation.m`](file:///d:/SIH_Dataset/AI_REBUILD/03_evaluation/finalize_phase2_evaluation.m):

```matlab
scores(e) = 0.40 * m.qwk + ...
            0.30 * m.macroF1 + ...
            0.20 * m.refSensitivity + ...
            0.10 * m.refSpecificity;
```

### Exact Numerical Derivation (Validation / Calibration Set, $N = 550$)

| Experiment | QWK ($40\%$) | Macro F1 ($30\%$) | Ref Sens ($20\%$) | Ref Spec ($10\%$) | Calculated Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`R18-V2-BASELINE`** | $0.40 \times 0.8472 = 0.3389$ | $0.30 \times 0.6031 = 0.1809$ | $0.20 \times 0.9148 = 0.1830$ | $0.10 \times 0.9327 = 0.0933$ | **0.7960** |
| **`R18-AUG`** | $0.40 \times 0.8388 = 0.3355$ | $0.30 \times 0.6161 = 0.1848$ | $0.20 \times 0.8430 = 0.1686$ | $0.10 \times 0.9450 = 0.0945$ | **0.7834** |
| **`R18-WEIGHTED`** | $0.40 \times 0.8532 = 0.3413$ | $0.30 \times 0.6312 = 0.1894$ | $0.20 \times 0.8924 = 0.1785$ | $0.10 \times 0.9541 = 0.0954$ | **0.8046** |
| **`R18-AUG-WEIGHTED`** | $0.40 \times 0.8507 = 0.3403$ | $0.30 \times 0.6272 = 0.1882$ | $0.20 \times 0.8251 = 0.1650$ | $0.10 \times 0.9664 = 0.0966$ | **0.7901** |
| **`R18-FINAL-CANDIDATE`**| $0.40 \times 0.8545 = 0.3418$ | $0.30 \times 0.6462 = 0.1939$ | $0.20 \times 0.7982 = 0.1596$ | $0.10 \times 0.9755 = 0.0976$ | **0.7929** |

---

## 2. Root Cause of the Ordering Discrepancy

Why did `R18-WEIGHTED` score higher on the 4-term formula (0.8046 vs 0.7929), while `R18-FINAL-CANDIDATE` was selected as the final candidate in the text?

1. **The Formula Completely Omitted Grade 3 and Grade 4 Recall:**
   - The 4-term linear formula assigned **0% weight** to Grade 3 recall and **0% weight** to Grade 4 recall.
   - It placed **20% weight on binary Referable Sensitivity** (where Grade 2, 3, and 4 are lumped together as $\ge 2$).
2. **`R18-WEIGHTED` Won the Binary Screening Margin:**
   - Because `R18-WEIGHTED` had higher binary referable sensitivity on validation (89.24% vs 79.82%, a $+9.42\%$ margin), it gained $+0.0188$ from that single term.
3. **`R18-FINAL-CANDIDATE` Won Every 5-Class Severity & Clinical Objective:**
   - The explicit mandate of Phase 2 was to resolve the severe grade collapse (where baseline recall was $19.35\%$ for Grade 3 and $31.11\%$ for Grade 4).
   - On the validation set, `R18-FINAL-CANDIDATE` outperformed `R18-WEIGHTED` on:
     - **Grade 3 Recall:** **38.71%** vs 25.81% ($+12.90\%$ absolute)
     - **Grade 4 Recall:** **55.56%** vs 37.78% ($+17.78\%$ absolute)
     - **Quadratic Weighted Kappa (QWK):** **0.8545** vs 0.8532 (Highest among all 5 experiments)
     - **Macro F1:** **0.6462** vs 0.6312 (Highest among all 5 experiments)
     - **Referable Specificity:** **97.55%** vs 95.41% ($+2.14\%$)
4. **The Evaluation Script Inconsistency:**
   - In `finalize_phase2_evaluation.m`, `[bestScore, bestIdx] = max(scores)` automatically assigned `bestExpName = 'R18-WEIGHTED'`.
   - However, the script author manually inspected the severe grade recalls and designated `R18-FINAL-CANDIDATE` in the discussion, leading to a mismatched header in `FINAL_MODEL_EVALUATION.md`.

---

## 3. Validation-Only Comparison Table ($N = 550$)

| Evaluation Metric | `R18-WEIGHTED` | `R18-FINAL-CANDIDATE` | Clinical Trade-Off / Margin |
| :--- | :---: | :---: | :--- |
| **Accuracy** | **81.09%** | 79.09% | $+2.00\%$ raw overall correctness |
| **QWK (Ordinal Agreement)** | 0.8532 | **0.8545** | $+0.0013$ favoring `R18-FINAL-CANDIDATE` |
| **Macro F1 (Class Balance)** | 0.6312 | **0.6462** | **$+0.0150$ (+1.50%) favoring `R18-FINAL-CANDIDATE`** |
| **Referable Sensitivity** | **89.24%** | 79.82% | $+9.42\%$ favoring `R18-WEIGHTED` (at default 0.5 threshold) |
| **Referable Specificity** | 95.41% | **97.55%** | $+2.14\%$ favoring `R18-FINAL-CANDIDATE` |
| **Referable AUC-ROC** | **0.9832** | 0.9831 | Essentially identical ($\Delta = 0.0001$) |
| **Grade 3 (Severe NPDR) Recall** | 25.81% | **38.71%** | **$+12.90\%$ favoring `R18-FINAL-CANDIDATE`** |
| **Grade 4 (Proliferative) Recall** | 37.78% | **55.56%** | **$+17.78\%$ favoring `R18-FINAL-CANDIDATE`** |
| **4-Term Selection Score** | **0.8046** | 0.7929 | Favors `R18-WEIGHTED` due to $20\%$ weight on binary sens |

---

## 4. Reproducibility Assessment

* **Data Check:** The metrics for both models are 100% reproducible and statically stored in:
  [`AI_REBUILD/03_evaluation/metrics/calibration_comparison.mat`](file:///d:/SIH_Dataset/AI_REBUILD/03_evaluation/metrics/calibration_comparison.mat)
* **Model Checkpoints:**
  - `R18-WEIGHTED`: [`AI_REBUILD/02_training/models/trained_dr_model_r18_weighted.mat`](file:///d:/SIH_Dataset/AI_REBUILD/02_training/models/trained_dr_model_r18_weighted.mat)
  - `R18-FINAL-CANDIDATE`: [`AI_REBUILD/02_training/models/trained_dr_model_r18_final_candidate.mat`](file:///d:/SIH_Dataset/AI_REBUILD/02_training/models/trained_dr_model_r18_final_candidate.mat)
* **Execution Script:** Re-running [`evaluateModelOnDataset.m`](file:///d:/SIH_Dataset/AI_REBUILD/03_evaluation/evaluateModelOnDataset.m) on the Calibration split deterministically reproduces these exact numbers to 4 decimal places.

---

## 5. Candidate Alignment & Proposed Selection Criteria

There are two valid clinical paradigms for selection, which must be explicitly agreed upon:

### Option A: 5-Class Ordinal & High-Grade Recall Optimization (Clinical Recommendation)
* **Philosophy:** The system is an ophthalmological grading engine (Grades 0–4). Missing Severe (Grade 3) and Proliferative (Grade 4) retinopathy has catastrophic clinical consequences (vision loss). High-grade recall must be directly weighted.
* **Criterion Formula:**
  $$\text{Score}_{\text{5-class}} = 0.30 \times \text{QWK} + 0.25 \times \text{MacroF1} + 0.15 \times \text{RefSens} + 0.15 \times \text{Gr3Rec} + 0.15 \times \text{Gr4Rec}$$
* **Validation Score:**
  - `R18-FINAL-CANDIDATE`: $0.30(0.8545) + 0.25(0.6462) + 0.15(0.7982) + 0.15(0.3871) + 0.15(0.5556) = \mathbf{0.6789}$
  - `R18-WEIGHTED`: $0.30(0.8532) + 0.25(0.6312) + 0.15(0.8924) + 0.15(0.2581) + 0.15(0.3778) = \mathbf{0.6429}$
* **Winner under Option A:** **`R18-FINAL-CANDIDATE`** (Filename: `trained_dr_model_r18_final_candidate.mat`)

### Option B: Binary Triage Screening Optimization (Conservative 4-Term Formula)
* **Philosophy:** The primary task is binary referral triage (Refer vs No-Refer). High uncalibrated sensitivity for Grade $\ge 2$ at the default 0.5 threshold takes precedence over fine-grained Grade 3/4 separation.
* **Criterion Formula:** Existing 4-term formula ($0.40 \times \text{QWK} + 0.30 \times \text{MacroF1} + 0.20 \times \text{RefSens} + 0.10 \times \text{RefSpec}$).
* **Winner under Option B:** **`R18-WEIGHTED`** (Filename: `trained_dr_model_r18_weighted.mat`)

> [!NOTE]
> In Phase 3 (Temperature Scaling & Probability Calibration), the binary decision threshold and temperature can be optimized on the calibration partition. The binary referable AUC for both models is virtually identical ($0.9832$ vs $0.9831$). However, post-hoc calibration cannot recover severe-grade representations if the backbone network cannot separate Grade 3/4 lesions.

---

## 6. Exact Status & Awaiting Approval

* **No models have been activated or moved to production.**
* **Production model [`trained_dr_model_preprocessed.mat`](file:///d:/SIH_Dataset/trained_dr_model_preprocessed.mat) remains active and untouched.**
* Both model files exist and are fully evaluated on the calibration set.
* **We STOP here and request user decision on Option A vs Option B before proceeding to Phase 3.**
