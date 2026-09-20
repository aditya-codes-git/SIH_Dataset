# RetinoScan AI — Phase 5 Retinal Anatomical Analysis & Candidate Finding Report

**Scope:** Unsupervised anatomical landmark localization, classical vessel architecture analysis, and candidate abnormal-region extraction cross-referenced with Grad-CAM model attention.  
**Approved Frozen Model:** `R18-FINAL-CANDIDATE` (`AI_REBUILD/02_training/models/trained_dr_model_r18_final_candidate.mat`) — **100% frozen; zero weight modifications**.

---

## 1. Executive Summary

Phase 5 introduces anatomical grounding and structural retinal evidence to RetinoScan AI. The system no longer relies solely on a single global grade and a heatmap; it now identifies the retinal boundary, localizes the optic disc, estimates the macular foveal region, analyzes blood vessel density, extracts candidate abnormal regions, and cross-references them with model attention hotspots.

> [!CRITICAL]
> **Strict Clinical Governance Notice:**
> The APTOS 2019 dataset provides **image-level diabetic retinopathy severity labels**, NOT lesion-level ground truth masks or bounding boxes.
> 
> Therefore, all detected features are strictly labeled as **"Candidate Findings"** or **"Model Attention Hotspots"**, **NEVER** as confirmed clinical lesions (e.g. microaneurysms, hemorrhages, or exudates). Candidate findings represent morphological saliency and do not constitute histopathologically validated lesion detection.

---

## 2. Anatomical Methodology

### A. Retinal Field Segmentation (`segmentRetinalField.m`)
* **Objective:** Isolate the circular/elliptical retinal fundus aperture from the dark camera background.
* **Method:** Luminance thresholding ($I > 10/255$) followed by 8-connectivity connected-component analysis in pure MATLAB to extract the largest contiguous retinal component.
* **Output:** Centroid $[c_x, c_y]$, horizontal and vertical radii $[r_x, r_y]$, bounding box, coverage ratio, and binary mask.

### B. Optic Disc Detection (`detectOpticDisc.m`)
* **Objective:** Localize the optic nerve head (optic disc).
* **Anatomical Principles:** Compact bright region in red/green channels ($\approx 8\%-14\%$ of retinal diameter) with high local contrast due to major blood vessel trunks.
* **Method:**
  1. Erode retinal field boundary by $8\%$ of image dimension to suppress bright aperture edge artifacts.
  2. Compute composite brightness $B = 0.5\,I_{\text{red}} + 0.5\,I_{\text{green}}$.
  3. Subtract local moving average to isolate compact bright structures from the smooth retinal background.
  4. Segment candidate clusters (top $2.5\%$ brightest values) and filter by circular compactness and anatomical area constraints.
  5. If candidate confidence is below threshold ($< 0.25$), safely mark `detected = false` with `NaN` coordinates. **Zero coordinate fabrication.**

### C. Macula / Fovea Estimation (`estimateMacula.m`)
* **Objective:** Estimate the fovea centralis / macula lutea.
* **Anatomical Principles:** Situated temporally to the optic disc at approximately $2.0–2.8$ disc diameters. Characterized by a natural hypo-pigmented green-channel depression (foveal avascular zone / FAZ).
* **Method:**
  1. Construct an anatomical search cone on the temporal side of the optic disc (or central posterior pole if disc is undetected).
  2. Smooth green channel to suppress fine capillaries while preserving the broader macular dip.
  3. Locate the local minimum intensity within the search cone.
  4. Validate local contrast depth ($\Delta \ge 4.0\text{ intensity units}$). If contrast is flat or ambiguous, mark `estimated = false`.

### D. Retinal Vessel Analysis (`analyzeRetinalVessels.m`)
* **Objective:** Classical structural extraction of retinal vascular branches.
* **Method:**
  1. Invert green channel: blood vessels appear as bright tubular ridges.
  2. Subtract local background illumination blur to remove broad illumination drift.
  3. Adaptive thresholding extracts primary and secondary vessel branches.
  4. Compute `vesselAreaRatio` (normal anatomical range $4\%–22\%$) and `branchDensity`. If vessel area is outside anatomical limits (e.g. due to severe blur or flash artifact), mark `available = false`.

### E. Candidate Abnormal Region Engine (`extractCandidateFindings.m`)
* **Objective:** Unsupervised extraction of salient retinal abnormalities.
* **Categories:**
  1. `candidate_bright_region`: Focal yellow/white spots (exudate/drusen candidates).
  2. `candidate_dark_region`: Focal dark/red punctate spots (microaneurysm/dot hemorrhage candidates).
  3. `candidate_red_region`: Larger dark-red intraretinal patches (blot hemorrhage candidates).
* **Anatomical Masking:** Suppresses the optic disc region and boundary edges to prevent physiological landmarks from being flagged as abnormalities.

### F. Evidence Cross-Referencing (`matchEvidenceRegions.m`)
* Combines candidate abnormal regions with Phase 4.5 Grad-CAM attention hotspots.
* For each candidate finding:
  - Determines bounding-box overlap with attention hotspots.
  - Measures Euclidean distance to nearest hotspot.
  - Samples Grad-CAM activation strength at candidate centroid.
  - Assigns anatomical context (e.g. *"Macular Vicinity"*, *"Peripapillary Region"*, *"Posterior Retinal Pole"*, *"Superior/Inferior Quadrants"*).
  - Flags `supportedByModelAttention = true` if inside/near an active attention hotspot.

---

## 3. Representative Gallery Benchmark ($N = 6$ Test Images)

| Image ID | Clinical Grade & Diagnosis | Field Coverage | Optic Disc Detected | Macula Estimated | Vessel Coverage | Candidates Extracted | Hotspots Extracted | Supported by Attention |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`0125fbd2e791`** | Grade 0 (No DR) | 79.1% | **Yes** (conf=0.29) | Safely unestimated | **Yes** (8.6%) | 12 | 6 | **5** |
| **`0684311afdfc`** | Grade 1 (Mild NPDR) | 83.4% | **Yes** (conf=0.50) | **Yes** (conf=0.34) | **Yes** (9.1%) | 12 | 6 | **2** |
| **`064af6592ba6`** | Grade 2 (Moderate NPDR) | 75.2% | **Yes** (conf=0.48) | **Yes** (conf=0.30) | **Yes** (8.8%) | 12 | 1 | **3** |
| **`069f43616fab`** | Grade 3 (Severe NPDR) | 54.9% | **Yes** (conf=0.35) | **Yes** (conf=0.60) | **Yes** (8.5%) | 12 | 6 | **1** |
| **`07122e268a1d`** | Grade 4 (Proliferative DR) | 71.6% | **Yes** (conf=0.53) | Safely unestimated | **Yes** (8.9%) | 12 | 6 | **3** |
| **`1623e8e3adc4`** | Difficult Severe Case | 74.6% | **Yes** (conf=0.40) | Safely unestimated | **Yes** (9.1%) | 12 | 5 | **0** |

All discrete visual assets saved under [`AI_REBUILD/07_retinal_analysis/validation_gallery/`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/validation_gallery/).

---

## 4. Visual Analysis Composite (`retinal_analysis.png`)

For every gradable screening image, Phase 5 generates 5 distinct assets:
1. `original_fundus.png`: High-resolution raw photograph.
2. `gradcam_overlay.png`: High-resolution transparent Grad-CAM overlay.
3. `attention_points.png`: Grad-CAM attention hotspots with compact local bounding boxes.
4. `retinal_landmarks.png`: Optic disc (Cyan circle + "OD") + Macula (Green circle + "MAC") + Retinal field contour.
5. `retinal_analysis.png`: Unified composite with landmarks, candidate finding boxes (Orange + "C1", "C2"...), attention badges (Yellow + "1", "2"...), and a diagnostic color legend.

---

## 5. Automated Validation & Regression Test Suite (Tests A–M)

Automated test suite [`test_retinal_analysis.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/test_retinal_analysis.m) passed all 13 checks:
* **Tests A & B:** Retinal mask exists and dimensions match original fundus ($3216 \times 2136$).
* **Tests C & D:** Optic disc and macula coordinates strictly inside image boundaries.
* **Test E:** Vessel mask dimensions match original fundus; vessel area ratio within plausible anatomical range ($8.79\%$).
* **Tests F & G:** Candidate finding coordinates and bounding boxes in bounds and normalized $[0, 1]$.
* **Tests H & I:** Absence of NaN or Inf in valid coordinate structures.
* **Test J (Failure Handling):** Synthetic black ungradable image correctly triggers `detected = false`, `estimated = false`, and returns `NaN` coordinates with zero fabricated points.
* **Test K:** Original camera dimensions ($3216 \times 2136$) preserved across all 5 generated PNG assets.
* **Test L:** Determinism check (repeated runs produce identical landmark coordinates).
* **Test M:** Production pipeline regression ([`test_deployed_pipeline.m`](file:///d:/SIH_Dataset/test_deployed_pipeline.m)) passed with **0 pixel difference**.
