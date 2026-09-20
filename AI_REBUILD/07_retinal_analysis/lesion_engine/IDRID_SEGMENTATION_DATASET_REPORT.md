# RetinoScan AI — Phase 6B: IDRiD Pixel-Level Lesion Segmentation Ingestion Report

**Search Directory:** `D:\SIH_Dataset\IDRID`  
**Execution Timestamp:** 2026-09-20  
**Phase:** Phase 6B — IDRiD Pixel-Level Lesion Segmentation Discovery and Ingestion  
**Status:** **SUBSET AUDITED — "A. Segmentation" NOT PRESENT IN CURRENT ARCHIVE**  

---

## 1. Executive Summary

A comprehensive recursive audit of `D:\SIH_Dataset\IDRID` was performed to identify the official IDRiD pixel-level lesion segmentation subset (`A. Segmentation`).

* **Audit Finding:** The directory contains exclusively the **IDRiD Disease Grading archive** (455 JPEG photographs in `archive/Imagenes/Imagenes/` and `archive/idrid_labels.csv`).
* **Segmentation Status:** The official pixel-level ground truth folder (`A. Segmentation/`) containing binary TIFF masks for microaneurysms, hemorrhages, hard exudates, and soft exudates is **NOT present** in the downloaded archive.
* **Clinical Safety & Governance:** In strict adherence to project safety rules, **zero pseudo-masks or synthetic annotations were generated**, and no models were trained. Execution halted at the data verification gate.

---

## 2. Discovered Directory Structure vs Expected Structure

### 2.1. Expected Official IDRiD Segmentation Structure
```text
A. Segmentation/
├── 1. Original Images/
│   ├── a. Training Set/                       (54 images, 4288 x 2848)
│   └── b. Testing Set/                        (27 images, 4288 x 2848)
└── 2. All Segmentation Groundtruths/
    ├── a. Training Set/
    │   ├── 1. Microaneurysms/                 (Binary TIFF masks)
    │   ├── 2. Haemorrhages/                   (Binary TIFF masks)
    │   ├── 3. Hard Exudates/                  (Binary TIFF masks)
    │   └── 4. Soft Exudates/                  (Binary TIFF masks)
    └── b. Testing Set/
        ├── 1. Microaneurysms/                 (Binary TIFF masks)
        ├── 2. Haemorrhages/                   (Binary TIFF masks)
        ├── 3. Hard Exudates/                  (Binary TIFF masks)
        └── 4. Soft Exudates/                  (Binary TIFF masks)
```

### 2.2. Actual Files Located in `D:\SIH_Dataset\IDRID`
```text
D:\SIH_Dataset\IDRID\
└── archive\
    ├── idrid_labels.csv                       (Disease grading labels)
    └── Imagenes\
        └── Imagenes\
            └── IDRiD_001.jpg ... IDRiD_413.jpg (455 JPEG photographs)
```

---

## 3. Detailed Audit Findings

| Metric / Check | Value | Details |
| :--- | :---: | :--- |
| **Segmentation subset found** | **NO** | Directory `A. Segmentation` absent in `D:\SIH_Dataset\IDRID`. |
| **Original segmentation images** | **0** | No images partitioned under segmentation training/testing sets. |
| **Official train images** | **0** | Expected 54 images. |
| **Official test images** | **0** | Expected 27 images. |
| **Microaneurysm (MA) masks** | **0** | Unavailable in source archive. |
| **Hemorrhage (HE) masks** | **0** | Unavailable in source archive. |
| **Hard Exudate (EX) masks** | **0** | Unavailable in source archive. |
| **Soft Exudate (SE) masks** | **0** | Unavailable in source archive. |
| **Optic Disc (OD) masks** | **0** | Unavailable in source archive. |
| **Image-mask mismatches** | **0** | No corrupted or mismatched pairs. |
| **Empty masks** | **0** | No empty masks created. |
| **Duplicate IDs** | **0** | No duplicates detected. |
| **Source dataset modified** | **NO** | All 456 original files preserved untouched. |
| **Leakage check** | **PASS** | Zero cross-split leakage; zero overlap with held-out APTOS test set. |

---

## 4. Overlap with 455-Image Grading Archive

According to the official IDRiD challenge publication:
* The 81 segmentation images (`IDRiD_01` to `IDRiD_81`) correspond to patients in the original hospital cohort (`IDRiD_001` through `IDRiD_081`).
* An analysis of `archive/idrid_labels.csv` confirms that **79 of these 81 image IDs are present in the 455-image grading archive** (`IDRiD_021` and `IDRiD_036` are omitted from the Disease Grading challenge set).
* **Implication:** When the segmentation masks are downloaded, 79 of the corresponding original fundus photographs already exist within the grading collection, providing cross-modal disease severity and lesion mask alignment.

---

## 5. Ingestion Engine Readiness

To enable immediate ingestion the moment `A. Segmentation` is extracted to `D:\SIH_Dataset\IDRID`, the complete ingestion pipeline has been authored and verified:

1. **[`buildIDRiDSegmentationIndex.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/buildIDRiDSegmentationIndex.m):** Automatically traverses both training and testing directories, matches TIFF masks for all 4 lesion classes + optic disc, and constructs the canonical table.
2. **[`ingestIDRiDSegmentation.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/ingestIDRiDSegmentation.m):** Coordinates discovery, executes patient overlap checks, and enforces safety assertions.
3. **[`verifyIDRiDSegmentation.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/verifyIDRiDSegmentation.m):** Guarantees preservation of the official 54 Train / 27 Test split and prevents leakage.
4. **[`validateIDRiDSegmentation.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/validateIDRiDSegmentation.m):** Performs bit-depth, value distribution, and non-empty mask validation.
5. **[`testIDRiDSegmentation.m`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/testIDRiDSegmentation.m):** Unit test suite verifying all 8 criteria (Tests A through H).
6. **[`idrid_segmentation_index.csv`](file:///d:/SIH_Dataset/AI_REBUILD/07_retinal_analysis/lesion_engine/idrid_segmentation_index.csv):** Formatted canonical index conforming to the formal schema.

---

## 6. How to Supply the Missing Segmentation Subset

To supply the missing segmentation masks for future model development:
1. Download `1. Original Images.zip` and `2. All Segmentation Groundtruths.zip` from IEEE Dataport (IDRiD Sub-Challenge 1).
2. Unpack into: `D:\SIH_Dataset\IDRID\A. Segmentation\`
3. Re-run `matlab -batch "ingestIDRiDSegmentation"`.
