# RetinoScan AI — Phase 6: Lesion Dataset & Annotation Requirements Specification

**Document Version:** 1.0.0  
**Phase:** Phase 6 — Actual Lesion Detection / Segmentation Engine  
**Status:** **HALTED AT DATASET REQUIREMENT GATE** (Strict Safety & Clinical Governance Rule)  

---

## 1. Dataset Availability Audit Results

A comprehensive audit of the workspace (`d:\SIH_Dataset`) was conducted to evaluate the availability of supervised lesion-level ground truth:

1. **Available Dataset in Workspace:**  
   - **APTOS 2019 Blindness Detection Dataset** (`train.csv`, `train_images/`).  
   - **Label Type:** Discrete **image-level diabetic retinopathy severity grades** (Integer grades 0 through 4: No DR, Mild NPDR, Moderate NPDR, Severe NPDR, Proliferative DR).  
   - **Lesion Annotations:** **None**. No lesion bounding boxes, pixel segmentation masks, polygon contours, or lesion-level diagnostic tags exist in the dataset.
2. **Additional Local Data:**  
   - No secondary ophthalmic datasets (such as IDRiD, DDR, e-ophtha, or DiaretDB) are present in the repository.
3. **Clinical & Scientific Governance Decision:**  
   - **PROHIBITION:** Training a supervised object detector (e.g., Faster R-CNN, YOLO) or segmentation network (e.g., U-Net) directly on APTOS image-level labels would require fabricating pseudo-labels, which is scientifically invalid and medically dangerous.  
   - **PROHIBITION:** Silently downloading external datasets or generating synthetic lesion labels without explicit clinical verification is strictly forbidden by project safety rules.  
   - **ACTION:** Execution is **halted at Phase 6 Step 1**, and the full specification of requirements is documented below for future ingestion of an authentic lesion-annotated dataset.

---

## 2. Required Lesion Classes & Clinical Definitions

To train a legitimate lesion detection or segmentation engine, the external dataset must provide distinct annotations for the following four fundamental diabetic retinopathy lesion classes:

| Lesion Class | Morphological Characteristics | Clinical Significance | Size / Scale Profile |
| :--- | :--- | :--- | :--- |
| **`MICROANEURYSM`** | Tiny, round, dark red focal dilations of retinal capillaries ($10 - 100\,\mu\text{m}$). | Earliest clinically observable sign of non-proliferative diabetic retinopathy (Grade 1). | Extremely small ($2 - 15$ pixels at native camera resolution). Sensitive to spatial downsampling. |
| **`HEMORRHAGE`** | Flame-shaped (superficial nerve fiber layer) or blot/dot-shaped (deep retinal layers) blood accumulations. | Marker of vascular compromise and progression from mild to moderate/severe NPDR (Grade 2–3). | Variable ($10 - 200+$ pixels). High contrast in green channel. |
| **`HARD_EXUDATE`** | Bright, yellow-white lipid and lipoprotein deposits with distinct, sharp margins. | Indicator of retinal edema and capillary leakage; critical when threatening or involving the macula. | Clustered or punctate ($5 - 150+$ pixels). High contrast in green and blue channels. |
| **`SOFT_EXUDATE`** *(Cotton-Wool Spots)* | Dull, pale gray-white patches with ill-defined, fluffy/feathery borders. | Micro-infarction of the nerve fiber layer, indicating severe capillary occlusion and ischemia (Grade 3). | Moderate to large ($30 - 300+$ pixels). Low-contrast edges. |

*Optional / Secondary Classes (if available in annotation package):*
- `IRMA` (Intraretinal Microvascular Abnormalities)
- `NEOVASCULARIZATION` (NVD at optic disc, NVE elsewhere in retina — hallmark of Proliferative DR, Grade 4)
- `VENOUS_BEADING`

---

## 3. Required Annotation Types & Specifications

The dataset must provide either **Pixel-Level Semantic/Instance Masks** or **High-Resolution Bounding Boxes**:

### 3.1. Option A: Pixel-Level Segmentation Masks (Preferred)
* **Format:** Binary lossless raster masks (PNG or uncompressed TIFF) matching the original fundus photography dimensions $(W \times H)$, or polygon coordinate lists.
* **Separation:** One binary mask per lesion class per photograph (e.g., `image_id_MA.png`, `image_id_HE.png`, `image_id_EX.png`, `image_id_SE.png`), where pixel value `255` denotes lesion presence and `0` denotes background retina.
* **Advantages:** Allows precise evaluation of lesion burden (total area, Dice score, intersection-over-union) and true anatomical boundary delineation.

### 3.2. Option B: Object Detection Bounding Boxes
* **Format:** Standard COCO JSON or Pascal VOC XML format:
  ```json
  {
    "image_id": "image_001.png",
    "width": 3216,
    "height": 2136,
    "annotations": [
      {
        "id": 101,
        "category": "MICROANEURYSM",
        "bbox": [1420, 980, 14, 16],
        "area": 224
      }
    ]
  }
  ```
* **Coordinate System:** Absolute image coordinates relative to the top-left corner $(0, 0)$ of the raw camera photograph. Normalized coordinates $[0, 1]$ must be computable without loss of fidelity.

---

## 4. Resolution & Patch-Based Processing Architecture

Because microaneurysms can measure as few as $2\text{--}10$ pixels across on standard fundus photographs ($3216 \times 2136$), resizing full fundus images directly into standard CNN input resolutions ($224 \times 224$ or $512 \times 512$) destroys high-frequency lesion signals through sub-pixel Nyquist aliasing.

The future lesion engine must implement a **tiled patch-based inference pipeline**:

```
Raw High-Resolution Fundus Image (e.g. 3216 x 2136)
                   │
                   ▼
       Retinal Masking & ROI Extraction (Phase 5)
                   │
                   ▼
     Overlapping Tile Extraction (e.g., 512 x 512 patches with 64px stride overlap)
                   │
                   ▼
     Patch-Level Lesion Detector / Segmenter
                   │
                   ▼
     Coordinate Re-projection to Native Camera Coordinate Space:
       X_global = X_patch + Tile_Origin_X
       Y_global = Y_patch + Tile_Origin_Y
                   │
                   ▼
     Non-Maximum Suppression (NMS) on Tile Boundary Overlaps
```

---

## 5. Dataset Split & Zero-Leakage Protocol

To ensure unbiased evaluation, the lesion-annotated dataset must adhere to the same zero-leakage standards established in Phase 1:

1. **Patient-Level Stratification:**  
   If patient or eye identifiers (Left Eye / Right Eye) are provided, all images from a single patient must strictly reside within a single split (Train, Validation, or Test).
2. **Split Proportions:**  
   - **Training Set (70%):** Model parameter optimization.
   - **Validation Set (15%):** Operating threshold selection (precision-recall F1 maximization) and early stopping.
   - **Held-out Test Set (15%):** Final frozen benchmark evaluation.
3. **Classifier Test Set Isolation:**  
   The held-out APTOS classification test set ($N = 548$) must **never** be used for lesion detector training or validation.

---

## 6. Recommended Open-Access Benchmark Datasets

When external data ingestion is approved, the following peer-reviewed, publicly available datasets meet all criteria outlined in this specification:

1. **IDRiD (Indian Diabetic Retinopathy Image Dataset):**  
   - *Annotations:* Full pixel-level ground truth masks for Microaneurysms, Hemorrhages, Hard Exudates, and Soft Exudates across 81 high-resolution images ($4288 \times 2848$).  
   - *Suitability:* Highest benchmark standard for ophthalmic lesion segmentation.
2. **DDR (Dataset for Diabetic Retinopathy):**  
   - *Annotations:* 757 images with pixel-level segmentation masks for 4 lesion types and 1,098 images with lesion bounding boxes.
3. **e-ophtha (e-ophtha-MA & e-ophtha-EX):**  
   - *Annotations:* Detailed microaneurysm and exudate segmentation masks with expert ophthalmologist annotations.
4. **DiaretDB1 (Diabetic Retinopathy Database and Evaluation Protocol):**  
   - *Annotations:* 89 fundus images with localized bounding contours for hemorrhages, hard exudates, and cotton-wool spots.

---

## 7. Strict Reporting & Terminology Standards

Until a dedicated model trained on a validated lesion dataset is integrated, RetinoScan AI strictly adheres to the following vocabulary in all user interfaces and reports:

| Feature Source | Permitted Terminology | Strictly Forbidden Terminology |
| :--- | :--- | :--- |
| **Image-level Classifier** | *"Grade 2: Moderate Non-Proliferative DR"* | *"Lesions detected"* |
| **Phase 4 Multi-Scale Grad-CAM** | *"Model Attention Hotspot (Focal Neural Activation)"* | *"Confirmed microaneurysm / hemorrhage"* |
| **Phase 5 Morphological Engine** | *"Candidate dark retinal region"*, *"Candidate bright retinal region"* | *"Detected microaneurysm"*, *"Detected exudate"* |
| **Future Phase 6 Lesion Engine** | *"Microaneurysm detected by lesion engine (Score: 0.88)"* | Permitted **ONLY** when supported by verified detector inference. |

---

## 8. Summary & Current Status

* **Status:** **PHASE 6 HALTED.**  
* **Reason:** No lesion-annotated dataset exists in the workspace, and pseudo-label generation from image-level grades is clinically and scientifically unacceptable.  
* **Production Status:** The existing approved classification pipeline (`R18-FINAL-CANDIDATE`), temperature calibration ($T^* = 1.8063$), multi-scale Grad-CAM fusion, and Phase 5 retinal anatomical analysis remain fully active, uncompromised, and operational.
