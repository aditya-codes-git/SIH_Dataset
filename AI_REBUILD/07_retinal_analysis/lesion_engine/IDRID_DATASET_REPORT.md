# RetinoScan AI — Phase 6A: IDRiD Dataset Ingestion & Validation Report

**Dataset Source:** `D:\SIH_Dataset\IDRID`  
**Ingestion Timestamp:** 2026-09-20  
**Phase:** Phase 6A — IDRiD Dataset Ingestion, Discovery, and Split Registration  
**Status:** **INGESTION COMPLETE — VALIDATED**  

---

## 1. Actual Folder Structure Discovered

A recursive inspection of `D:\SIH_Dataset\IDRID` revealed the following directory structure:

```text
D:\SIH_Dataset\IDRID\
└── archive\
    ├── idrid_labels.csv                     (10,572 bytes, 455 rows)
    └── Imagenes\
        └── Imagenes\
            ├── IDRiD_001.jpg                (4288 x 2848, 24-bit TrueColor)
            ├── IDRiD_002.jpg
            ├── ...
            └── IDRiD_413.jpg / IDRiD_...test.jpg  (Total: 455 .jpg files)
```

**Total Discovered Files:** 456 files (455 JPEG photographs + 1 metadata CSV). Zero files were moved, renamed, modified, or deleted during ingestion.

---

## 2. Dataset Image Count

* **Total Fundus Photographs Discovered:** **455 images**
* **Format:** Baseline JPEG (`.jpg`), 24-bit RGB TrueColor.
* **Corrupt / Unreadable Files:** **0** (All 455 images decoded successfully).

---

## 3. Annotation Count by Class & Types Audited

Per Section 3 of the Phase 6A specification, all candidate annotation modalities were systematically audited:

| Annotation Modality | Files Found | Status | Format / Representation |
| :--- | :---: | :---: | :--- |
| **Microaneurysms** | 0 | **UNAVAILABLE** | No binary lesion masks or bounding boxes in archive. |
| **Hemorrhages** | 0 | **UNAVAILABLE** | No binary lesion masks or bounding boxes in archive. |
| **Hard Exudates** | 0 | **UNAVAILABLE** | No binary lesion masks or bounding boxes in archive. |
| **Soft Exudates (Cotton-Wool)** | 0 | **UNAVAILABLE** | No binary lesion masks or bounding boxes in archive. |
| **Optic Disc Masks** | 0 | **UNAVAILABLE** | No optic disc segmentation contours in archive. |
| **Fovea / Macula Coordinates** | 0 | **UNAVAILABLE** | No landmark coordinate files in archive. |
| **Diabetic Retinopathy Grade** | **455** | **AVAILABLE** | Discrete severity grade $[0, 4]$ in `idrid_labels.csv`. |
| **Macular Edema Risk Grade** | **455** | **AVAILABLE** | Discrete DME risk $[0, 2]$ in `idrid_labels.csv`. |

> [!NOTE]
> The dataset located at `D:\SIH_Dataset\IDRID` corresponds specifically to the **IDRiD Disease Grading and Risk of Macular Edema Challenge (Sub-Challenge 2)**. The pixel-level lesion segmentation masks (Sub-Challenge 1: `A. Segmentation`) and anatomical landmark coordinates (Sub-Challenge 3: `C. Localization`) were not part of this specific Kaggle archive download.
> Per clinical safety rules, absent annotation fields are recorded as `NA` and `NaN`; no synthetic labels or coordinates were fabricated.

---

## 4. Annotation Formats & Column Mapping

The metadata file `archive/idrid_labels.csv` contains 455 rows matching 100% of the image files:

| Column Name | Type | Value Range | Interpretation |
| :--- | :--- | :--- | :--- |
| `id_code` | String | `IDRiD_001` to `IDRiD_...` | Primary image identifier (1-to-1 match with file base name). |
| `diagnosis` | Integer | `0` to `4` | International Clinical Diabetic Retinopathy Severity Grade. |
| `Risk of macular edema ` | Integer | `0` to `2` | Clinical risk of diabetic macular edema ($0 = \text{No}$, $1 = \text{Mild}$, $2 = \text{Clinically Significant}$). |

---

## 5. Image & Mask Dimensions Audit

* **Fundus Image Width:** **4,288 pixels** (100% uniform across all 455 images).
* **Fundus Image Height:** **2,848 pixels** (100% uniform across all 455 images).
* **Aspect Ratio:** $1.5056 : 1$ ($3:2$ nominal sensor ratio).
* **Color Space:** 24-bit TrueColor RGB ($8$ bits per channel).
* **Dimension Mismatches:** **0**.
* **Lesion Mask Dimensions:** N/A (lesion masks absent in this archive).

---

## 6. Coordinate System Convention

All coordinate representations across RetinoScan AI strictly adhere to:
* **Origin $(0, 0)$:** Top-left corner of the native $4288 \times 2848$ photograph.
* **X-axis:** Horizontal axis, spanning $[0, 4288]$ pixels (left to right).
* **Y-axis:** Vertical axis, spanning $[0, 2848]$ pixels (top to bottom).
* **Pixel Indexing:** 1-based indexing in MATLAB scripts, 0-based normalized $[0, 1]$ bounding box and landmark formats in exported JSON.
* **Coordinate Invariance:** In accordance with Section 8, any future patch-based detector coordinates must be mapped back to native camera space before clinical reporting.

---

## 7. Patient Grouping & Split Partition

* **Patient Identifier Audit:** The provided `idrid_labels.csv` and image filenames contain only anonymous running IDs (`IDRiD_001`, `IDRiD_002`, etc.) without patient ID or left/right eye designations.
* **Partition Strategy:** Stratified random split at the **image level** across DR diagnosis severity grades ($0\text{--}4$) using deterministic seed `rng(42, 'twister')`.
* **Proportions:**
  * **TRAIN (70% target):** **318 images (69.9%)**
  * **VALIDATION (15% target):** **68 images (14.9%)**
  * **TEST (15% target):** **69 images (15.2%)**
  * **Total:** **455 images (100.0%)**

---

## 8. Leakage Checks & Split Verification

The automated verification gate [`verifyIDRiDSplits.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/verifyIDRiDSplits.m) executed and passed all assertions:
1. **Unique Image IDs:** 455 unique IDs across 455 rows (0 duplicates).
2. **Train $\cap$ Validation Overlap:** **0 images** ($\emptyset$).
3. **Train $\cap$ Test Overlap:** **0 images** ($\emptyset$).
4. **Validation $\cap$ Test Overlap:** **0 images** ($\emptyset$).
5. **Index Concordance:** 100% bijective mapping with [`idrid_index.csv`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/idrid_index.csv).
6. **APTOS Isolation:** 100% isolated from the held-out APTOS classification test set ($N = 548$).

---

## 9. Dataset Statistics (Disease Severity Distribution)

### 9.1. Diabetic Retinopathy Diagnosis (Grade 0–4)
| Grade | Description | Total Count | Train | Validation | Test |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **0** | No Diabetic Retinopathy | **129** (28.4%) | 90 | 19 | 20 |
| **1** | Mild Non-Proliferative DR | **22** (4.8%) | 15 | 3 | 4 |
| **2** | Moderate Non-Proliferative DR | **156** (34.3%) | 109 | 23 | 24 |
| **3** | Severe Non-Proliferative DR | **84** (18.5%) | 59 | 13 | 12 |
| **4** | Proliferative Diabetic Retinopathy | **64** (14.1%) | 45 | 10 | 9 |
| **Total** | | **455** (100%) | **318** | **68** | **69** |

### 9.2. Macular Edema Risk Distribution
* **Risk 0 (No Macular Edema):** 168 images (36.9%)
* **Risk 1 (Mild DME Risk):** 48 images (10.5%)
* **Risk 2 (High / Clinically Significant DME Risk):** 239 images (52.5%)

---

## 10. Visual QA Results

Representative downscaled preview samples spanning all 5 disease severity grades were generated and saved in [`AI_REBUILD/07_retinal_analysis/lesion_engine/validation_gallery/`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/validation_gallery/):
* `qa_sample_grade0_IDRiD_029test.jpg` (Grade 0: Normal fundus)
* `qa_sample_grade1_IDRiD_064test.jpg` (Grade 1: Mild NPDR)
* `qa_sample_grade2_IDRiD_003.jpg` (Grade 2: Moderate NPDR)
* `qa_sample_grade3_IDRiD_001.jpg` (Grade 3: Severe NPDR)
* `qa_sample_grade4_IDRiD_001test.jpg` (Grade 4: Proliferative DR)

---

## 11. Limitations & Findings

1. **Sub-Challenge Scope:** The present download contains Sub-Challenge 2 (Disease Grading + Macular Edema Risk). It does not contain the pixel-level lesion segmentation masks from Sub-Challenge 1 (`A. Segmentation`).
2. **Supervised Lesion Training:** Because lesion-level ground truth masks are absent in this archive, training a supervised lesion detection or segmentation model (U-Net, Mask R-CNN, YOLO) cannot be performed without ingesting the segmentation sub-challenge archive.
3. **External Validation Value:** This dataset provides an external clinical grading validation cohort of 455 high-resolution ($4288 \times 2848$) images to test generalization of the frozen `R18-FINAL-CANDIDATE` classification and Grad-CAM explainability pipeline across clinical sites.

---

## 12. Ingestion Artifacts Created

| Artifact | Path |
| :--- | :--- |
| **Canonical Index** | [`idrid_index.csv`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/idrid_index.csv) |
| **Dataset Splits** | [`idrid_splits.csv`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/idrid_splits.csv) |
| **Index Builder** | [`buildIDRiDIndex.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/buildIDRiDIndex.m) |
| **Ingestion Pipeline** | [`ingestIDRiD.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/ingestIDRiD.m) |
| **Dataset Auditor** | [`validateIDRiD.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/validateIDRiD.m) |
| **Leakage Verifier** | [`verifyIDRiDSplits.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/verifyIDRiDSplits.m) |
| **Automated Tests** | [`testIDRiDIngestion.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/testIDRiDIngestion.m) |
| **Data Schema** | [`IDRID_DATASET_SCHEMA.md`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/IDRID_DATASET_SCHEMA.md) |
| **QA Gallery** | [`validation_gallery/`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/validation_gallery/) |
