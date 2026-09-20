# RetinoScan AI — Phase 3 Probability Calibration & Risk Report

## 1. Frozen Model Governance

- **Selected Model:** `R18-FINAL-CANDIDATE`
- **Model Checkpoint:** `AI_REBUILD/02_training/models/trained_dr_model_r18_final_candidate.mat`
- **SHA-256 Checksum:** `da2f250763a12e51e4922f36d0b3f3237eaf3d324cec15f90770d7f40545de74`
- **Model Status:** **FROZEN** (No retrained weights, no fine-tuning).

## 2. Calibration Dataset Partition

- **Partition Used:** Canonical CALIBRATION split ONLY ($N = 550$ images).
- **Zero Test Data Guarantee:** Verified programmatically that 0 of 548 TEST images were touched during fitting.
- **Zero Train Data Guarantee:** Verified programmatically that 0 of 2564 TRAIN images were touched.

## 3. Mathematical Methodology

Logits $z \in \mathbb{R}^5$ were extracted directly from the pre-softmax fully connected layer (`new_fc`).
A scalar temperature parameter $T > 0$ was fit by minimizing multi-class Negative Log-Likelihood (NLL):

$$\mathcal{L}(T) = -\frac{1}{N} \sum_{i=1}^N \ln \left( \frac{\exp(z_{i, y_i} / T)}{\sum_{j=0}^4 \exp(z_{i, j} / T)} \right)$$

- **Optimal Temperature:** **T* = 1.8063**

## 4. Calibration Error Benchmarks

| Metric | Raw Softmax | Calibrated | Change |
| :--- | :---: | :---: | :---: |
| **Expected Calibration Error (ECE)** | **0.0900** | **0.0345** | **-61.7%** |
| **Multi-Class Brier Score** | **0.3131** | **0.2939** | **-6.12%** |
| **Log Loss (Cross-Entropy)** | **0.6287** | **0.5473** | **-12.95%** |

## 5. Continuous Referable-Risk Formulation

The probability of referable diabetic retinopathy is defined analytically as:

$$P(\text{Referable}) = P(\text{Grade 2}) + P(\text{Grade 3}) + P(\text{Grade 4})$$
$$P(\text{Non-Referable}) = P(\text{Grade 0}) + P(\text{Grade 1})$$

With $P(\text{Referable}) + P(\text{Non-Referable}) = 1.0$.

## 6. Critical Operational Distinction

1. **Calibration improves probability reliability**, not raw discriminative classification capacity (AUC and ROC curves are order-preserving).
2. **The current production decision remains strictly:**
   $$\text{predicted grade} \ge 2 \implies \text{REFERABLE DR}$$
   This logic has NOT been altered in Phase 3.
3. Operating point analysis demonstrates that lowering the referral threshold $\tau$ from 0.50 to 0.35 increases Referable Sensitivity from 79.82% to 88.34% on the calibration partition, providing a clear future mechanism for clinical screening trade-offs without modifying backbone weights.
