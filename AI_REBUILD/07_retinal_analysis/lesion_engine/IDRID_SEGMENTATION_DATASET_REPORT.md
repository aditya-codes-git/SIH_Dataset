# RetinoScan AI — Phase 6B: IDRiD Pixel-Level Lesion Segmentation Ingestion & Validation Report

**Dataset Source:** `D:\SIH_Dataset\IDRID\A. Segmentation`  
**Execution Timestamp:** 2026-09-20  
**Phase:** Phase 6B — IDRiD Pixel-Level Lesion Segmentation Ingestion & Validation  
**Status:** **PHASE 6B COMPLETE — 100% VALIDATED (ZERO REGRESSIONS)**  

---

## 1. Executive Summary

The official IDRiD Pixel-Level Lesion Segmentation dataset package (`A. Segmentation`) has been recursively discovered, indexed, and deeply validated without altering or modifying a single source file.

* **Original Images Ingested:** **81 high-resolution RGB fundus photographs** ($4288 \times 2848$, 24-bit TrueColor).
* **Official Split Preserved:** **54 Training images (66.7%)**, **27 Testing images (33.3%)**.
* **Pixel-Level Ground Truth Masks Ingested:** **363 lossless TIFF masks** across 4 primary diabetic retinopathy lesion classes + Optic Disc.
* **Integrity & Zero Leakage:** 0 corrupt/unreadable files, 0 dimension mismatches, 0 empty masks, 0 duplicate IDs, and zero cross-split leakage ($\text{Train} \cap \text{Test} = \emptyset$).
* **APTOS Isolation:** Completely independent of the APTOS classification dataset ($0$ overlap) and held-out APTOS test set ($0$ overlap).

---

## 2. Directory Structure Discovered

The package under `D:\SIH_Dataset\IDRID\A. Segmentation` was recursively mapped:

```text
D:\SIH_Dataset\IDRID\A. Segmentation\A. Segmentation\
├── 1. Original Images\
│   ├── a. Training Set\                       (54 JPEG images: IDRiD_01.jpg ... IDRiD_54.jpg)
│   └── b. Testing Set\                        (27 JPEG images: IDRiD_55.jpg ... IDRiD_81.jpg)
├── 2. All Segmentation Groundtruths\
│   ├── a. Training Set\
│   │   ├── 1. Microaneurysms\                 (54 binary TIFF masks: *_MA.tif)
│   │   ├── 2. Haemorrhages\                   (53 binary TIFF masks: *_HE.tif — IDRiD_43 absent)
│   │   ├── 3. Hard Exudates\                  (54 binary TIFF masks: *_EX.tif)
│   │   ├── 4. Soft Exudates\                  (26 binary TIFF masks: *_SE.tif)
│   │   └── 5. Optic Disc\                     (54 binary TIFF masks: *_OD.tif)
│   └── b. Testing Set\
│       ├── 1. Microaneurysms\                 (27 binary TIFF masks: *_MA.tif)
│       ├── 2. Haemorrhages\                   (27 binary TIFF masks: *_HE.tif)
│       ├── 3. Hard Exudates\                  (27 binary TIFF masks: *_EX.tif)
│       ├── 4. Soft Exudates\                  (14 binary TIFF masks: *_SE.tif)
│       └── 5. Optic Disc\                     (27 binary TIFF masks: *_OD.tif)
├── CC-BY-4.0.txt
└── LICENSE.txt
```

**Total Discovered Files in Segmentation Directory:** **446 files** (81 JPEG images, 363 TIFF masks, 2 text licenses). Zero files modified, renamed, moved, or deleted.

---

## 3. Detailed Dataset Statistics & Mask Breakdown

| Lesion / Landmark Class | Total Masks | Training Set ($N=54$) | Testing Set ($N=27$) | Mask Format | Total Foreground Pixels | Mean Area / Image ($\text{px}$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Microaneurysms (MA)** | **81** | 54 | 27 | 1-bit TIFF | **1,028,859** | 12,702 |
| **Haemorrhages (HE)** | **80** | 53 | 27 | 1-bit TIFF | **10,017,004** | 125,213 |
| **Hard Exudates (EX)** | **81** | 54 | 27 | 1-bit / 8-bit TIFF | **21,109,668** | 260,613 |
| **Soft Exudates (SE)** | **40** | 26 | 14 | 1-bit TIFF | **1,844,933** | 46,123 |
| **Optic Disc (OD)** | **81** | 54 | 27 | 1-bit TIFF | **17,615,028** | 217,470 |
| **Total Ground Truths** | **363** | **241** | **122** | | **51,615,492** | |

### Key Clinical & Morphological Observations
1. **Microaneurysms:** 100% of images exhibit microaneurysms ($N=81$). However, total pixel burden is the smallest ($1.03\times 10^6$ px), confirming that microaneurysms occupy punctate focal footprints sensitive to downsampling.
2. **Haemorrhages:** Present in 80 of 81 images. Training case `IDRiD_43` (Mild NPDR) legitimately lacks hemorrhages, so no `IDRiD_43_HE.tif` exists.
3. **Hard Exudates:** Present in all 81 images ($2.11\times 10^7$ px), reflecting the high prevalence of diabetic macular edema in the hospital cohort.
4. **Soft Exudates:** Present in 40 of 81 images (26 train, 14 test), reflecting cotton-wool infarcts predominantly in severe/proliferative stages.
5. **Optic Disc:** Segmented in all 81 images ($N=81$), providing ground truth for disc exclusion and anatomical referencing.

---

## 4. Deep Image & Mask Validation Results

Every image and mask was audited individually:
* **Unreadable Images:** **0** (All 81 JPEG images successfully decoded).
* **Unreadable Masks:** **0** (All 363 TIFF masks successfully decoded).
* **Dimensions:** **$4288 \times 2848$** (100% uniform across all 81 images and 363 masks; **0 dimension mismatches**).
* **Empty Masks:** **0** (Every single mask file contains $> 0$ foreground pixels).
* **Mask Datatypes:** 362 masks are 1-bit binary (`[0, 1]` or `[false, true]`); 1 mask (`IDRiD_81_EX.tif`) is 8-bit grayscale with binary values `[0, 255]`. Both conform to standard binary masks.
* **Duplicate IDs:** **0**.
* **Train / Test Partition Overlap:** **0** ($\text{Train} \cap \text{Test} = \emptyset$).

---

## 5. Cross-Dataset Overlap Audit

1. **Overlap with 455-Image IDRiD Grading Archive (`D:\SIH_Dataset\IDRID\archive\`):**
   * The 81 segmentation patients (`IDRiD_01` to `IDRiD_81`) map to `IDRiD_001` through `IDRiD_081`.
   * **79 of 81 segmentation images exist in the grading archive** (clinical grades available).
   * **2 images (`IDRiD_21` and `IDRiD_36`) were omitted from the grading challenge set**, and thus have no image-level labels in `idrid_labels.csv`.
   * **Clinical Grade Distribution among Segmentation Images ($N=79$):**
     * Grade 0 (No DR): **0** (The segmentation challenge intentionally focused on diseased retinas).
     * Grade 1 (Mild NPDR): **1** (`IDRiD_43`: MA and EX only, no HE or SE).
     * Grade 2 (Moderate NPDR): **34**.
     * Grade 3 (Severe NPDR): **21**.
     * Grade 4 (Proliferative DR): **23**.
2. **Overlap with APTOS Classification Dataset:**
   * **0 images** (100% disjoint cohorts, different hospital systems, different cameras).
3. **Overlap with Held-out APTOS Test Set ($N=548$):**
   * **0 images** (Zero data leakage).

---

## 6. Visual QA Gallery Generated

High-resolution visual inspection overlays were generated outside the source dataset in [`AI_REBUILD/07_retinal_analysis/lesion_engine/validation_gallery/`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/validation_gallery/):
* `seg_sample_IDRiD_03_original.jpg` — Original RGB fundus ($712 \times 1072$ inspection preview).
* `seg_sample_IDRiD_03_MA_mask.png` — Microaneurysms ground truth mask.
* `seg_sample_IDRiD_03_HE_mask.png` — Haemorrhages ground truth mask.
* `seg_sample_IDRiD_03_EX_mask.png` — Hard Exudates ground truth mask.
* `seg_sample_IDRiD_03_SE_mask.png` — Soft Exudates ground truth mask.
* `seg_sample_IDRiD_03_OD_mask.png` — Optic Disc ground truth mask.
* `seg_sample_IDRiD_03_all_lesions_overlay.jpg` — Multi-color clinical overlay (Red=HE, Magenta=MA, Yellow=EX, Cyan=SE, Blue=OD).
* `seg_sample_IDRiD_43_mild_original.jpg` & `seg_sample_IDRiD_43_mild_overlay.jpg` — Mild NPDR validation (MA and EX focal lesion verification).

---

## 7. Compliance & Safety Rules Verification

* **Original Dataset Modified:** **NO** (All 446 files under `A. Segmentation/` and 456 files under `archive/` preserved untouched).
* **Pseudo-Labels Created:** **NO** (Only authentic expert ophthalmologist annotations ingested).
* **Lesion Models Trained:** **NO** (Execution halted at ingestion gate; zero model training or hyperparameter fitting initiated).
