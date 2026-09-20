# RetinoScan AI — Phase 4 Grad-CAM & Attention Hotspot Validation Report

**Scope:** High-resolution model attention explainability, dynamic transparency, and hotspot localization.  
**Approved Frozen Model:** `R18-FINAL-CANDIDATE` (`AI_REBUILD/02_training/models/trained_dr_model_r18_final_candidate.mat`)

---

## 1. Architectural Comparison: Previous vs Improved Grad-CAM

| Architectural Dimension | Old Production Grad-CAM | Improved Phase 4 Grad-CAM Engine | Clinical Advantage |
| :--- | :--- | :--- | :--- |
| **Target Feature Layer** | Implicit MATLAB default | Explicitly pinned to `'res5b_relu'` | Pinned to final conv layer (optimal semantic/spatial balance) |
| **Explanation Target** | Hardcoded or raw prediction | Calibrated predicted class | Explains actual model diagnosis |
| **Underlying Image Displayed** | Ben Graham $224 \times 224$ contrast image | **Original high-resolution fundus photograph** | Ophthalmologist views true clinical retinal anatomy |
| **Spatial Mapping** | Resized only to $224 \times 224$ | **Inverse FOV-crop coordinate mapping** | Heatmap aligns with original camera resolution ($3216 \times 2136$, etc.) |
| **Alpha Transparency** | Flat uniform `AlphaData = 0.35` | **Activation-dependent alpha mask** ($A = 0$ for $M < 0.20$) | **Zero blue fog**; healthy retina remains 100% natural and clear |
| **Color Mapping** | Standard `jet` | Perceptually uniform `turbo` | Smooth gradients without artificial boundaries |
| **Hotspot Characterization** | None (pure raster image) | Automated connected component extraction | Quantified centroids, bounding boxes, areas, and ranking |
| **Output Assets** | Single flattened image | **4 discrete assets + structured JSON** | Workstation-ready for interactive toggles |

---

## 2. Selected Feature Layer Analysis

Three candidate layers from the frozen ResNet-18 architecture were empirically tested:

1. **`res3b_relu` (Intermediate Residual Block, $28 \times 28$):** Captured fine high-frequency textural edges with high gradient variance ($-1.92$ to $+18.87$), but lacked semantic class-specific lesion understanding.
2. **`res4b_relu` (Late Residual Block, $14 \times 14$):** Exhibited higher spatial granularity, but activations were fragmented and occasionally picked up non-pathological illumination gradients.
3. **`res5b_relu` (Final Convolutional Activation Layer, $7 \times 7$ feature map):** Provided the cleanest localization of pathological features with minimal background noise and stable gradients. **Selected as authoritative explainability layer.**

---

## 3. High-Resolution Inverse Coordinate Mapping

The classification network processes a Ben Graham preprocessed $224 \times 224$ image cropped to the retinal field of view $[r_{\text{min}}, r_{\text{max}}, c_{\text{min}}, c_{\text{max}}]$.
To display the heatmap on the original camera image:
1. The $224 \times 224$ normalized heatmap is bilinearly resized to the exact pixel dimensions of the cropped retinal bounding box $[(r_{\text{max}} - r_{\text{min}} + 1) \times (c_{\text{max}} - c_{\text{min}} + 1)]$.
2. It is placed back onto the full original $H_{\text{orig}} \times W_{\text{orig}}$ canvas.
3. Pixels outside the retinal FOV mask have $\text{alpha} = 0$.

Result: **Heatmaps and hotspot markers perfectly match anatomical landmarks (optic disc, macula, and vessels) on the raw, un-distorted fundus image.**

---

## 4. Elimination of Background "Blue Fog"

The previous implementation suffered from a severe visual artifact where low-activation background pixels were rendered as 35% opaque blue due to `colormap jet` and uniform `AlphaData = 0.35`.

In Phase 4, the transparency mask is dynamically scaled by model attention:
$$\alpha(x, y) = \begin{cases} 
0, & M(x, y) < 0.20 \\
0.70 \times \left( \frac{M(x, y) - 0.20}{0.60 - 0.20} \right)^{1.2}, & 0.20 \le M(x, y) \le 0.60 \\
0.70, & M(x, y) > 0.60
\end{cases}$$

* Where model activation is low or zero ($M < 0.20$), $\alpha = 0$, meaning **100% of the underlying retina is visible with zero color alteration**.
* Where model activation is strong ($M \ge 0.60$), the overlay smoothly highlights regions in warm tones (yellow to orange to red) up to 70% opacity.

---

## 5. Model Attention Hotspots Methodology

* **Extraction Algorithm:** High-activation connected component segmentation implemented in pure MATLAB (zero external toolbox dependencies).
* **Thresholding:** Adaptive threshold set at $\max(0.45 \times \max(M), 0.35)$.
* **Noise Filter:** Minimum area filter suppresses components smaller than 0.1% of retinal area.
* **Composite Ranking Score:**
  $$\text{Strength} = 0.50 \times \text{PeakActivation} + 0.30 \times \text{MeanActivation} + 0.20 \times \min(\text{AreaRatio} \times 20, 1.0)$$
* **Configurable Top-$K$:** Defaults to top 3–8 most salient attention regions.
* **Coarse Anatomical Labeling:** Quadrant analysis relative to image center (e.g. "Central / Posterior Retinal Pole", "Superior Retinal Region", "Inferior Retinal Region").

> [!WARNING]
> **Strict Clinical Governance Rule:**
> Regions identified by Grad-CAM are labeled exclusively as **"Model Attention Hotspots"** or **"Attention Regions"**. They MUST NEVER be labeled as confirmed clinical lesions (e.g. "Microaneurysms", "Cotton Wool Spots", "Neovascularization"). Grad-CAM indicates visual attention of the neural network, not histopathological tissue confirmation.

---

## 6. Representative Comparative Visualizations

Side-by-side comparison images generated in `AI_REBUILD/06_explainability/comparisons/`:

| Case | Grade & Description | Test Sample ID | Comparison Asset |
| :---: | :--- | :---: | :--- |
| **Grade 0** | No Apparent DR | `0125fbd2e791` | [`comparison_grade0_0125fbd2e791.png`](file:///d:/SIH_Dataset/AI_REBUILD/06_explainability/comparisons/comparison_grade0_0125fbd2e791.png) |
| **Grade 1** | Mild NPDR | `0684311afdfc` | [`comparison_grade1_0684311afdfc.png`](file:///d:/SIH_Dataset/AI_REBUILD/06_explainability/comparisons/comparison_grade1_0684311afdfc.png) |
| **Grade 2** | Moderate NPDR | `064af6592ba6` | [`comparison_grade2_064af6592ba6.png`](file:///d:/SIH_Dataset/AI_REBUILD/06_explainability/comparisons/comparison_grade2_064af6592ba6.png) |
| **Grade 3** | Severe NPDR | `069f43616fab` | [`comparison_grade3_069f43616fab.png`](file:///d:/SIH_Dataset/AI_REBUILD/06_explainability/comparisons/comparison_grade3_069f43616fab.png) |
| **Grade 4** | Proliferative DR | `07122e268a1d` | [`comparison_grade4_07122e268a1d.png`](file:///d:/SIH_Dataset/AI_REBUILD/06_explainability/comparisons/comparison_grade4_07122e268a1d.png) |

---

## 7. Automated Quality & Regression Tests (Tests A–M)

Executed via [`AI_REBUILD/06_explainability/validateGradcam.m`](file:///d:/SIH_Dataset/AI_REBUILD/06_explainability/validateGradcam.m):

* **Test A:** Heatmap exists and is non-empty — **PASSED**
* **Test B & C:** Dimensions match original high-resolution fundus ($3216 \times 2136$) — **PASSED**
* **Test D & E:** Absence of NaN or Inf values — **PASSED**
* **Test F:** Meaningful contrast (range $[0.0000, 1.0000]$) — **PASSED**
* **Test G:** Hotspot coordinates verified inside image boundaries — **PASSED**
* **Test H:** Target class matches predicted class — **PASSED**
* **Test I, J, K:** Dynamic alpha mask verified; 0% opacity on low-attention background — **PASSED**
* **Test L:** Numbered points match structured JSON hotspot metadata — **PASSED**
* **Test M:** Determinism check (repeated runs produce $0.000000 \times 10^0$ diff) — **PASSED**
* **Package Generator:** All 4 discrete assets + JSON metadata created — **PASSED**
