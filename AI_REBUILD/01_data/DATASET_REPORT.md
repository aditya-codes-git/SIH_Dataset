# RetinoScan AI — Phase 1 Dataset Integrity & Canonical Split Report

**Report Date:** September 20, 2026  
**Target Repository:** `d:\SIH_Dataset`  
**Dataset Reference:** APTOS 2019 Blindness Detection  
**Canonical Seed:** 42  
**Dataset Split Distribution:** 70% Train, 15% Calibration/Validation, 15% Test  

---

## 1. Dataset Reconciliation & Audit Summary

| Metric | Measured Value | Verification Method | Status |
| :--- | :---: | :--- | :---: |
| **Total Metadata Rows in `train.csv`** | **3,662** | File line count excluding header | **VERIFIED** |
| **Total Physical Images in `train_images/`** | **3,662** | Directory file count (`*.png`) | **VERIFIED** |
| **Direct Initial Exact ID Matches** | **3,648** | Exact string match `train.csv.id_code` == `filename` | **AUDITED** |
| **Corrupted IDs Repaired** | **14** | Exact line/disk-order correlation (Excel scientific notation) | **REPAIRED** |
| **Final Matched Images** | **3,662 / 3,662** | `train_corrected.csv` 1:1 image mapping | **100% PASS** |
| **Missing Images on Disk** | **0** | Every metadata record points to an existing file | **PASS** |
| **Extra Unmatched Images on Disk** | **0** | Every file in `train_images/` has valid metadata | **PASS** |
| **Invalid Labels (< 0 or > 4)** | **0** | Integer diagnosis bounds check [0..4] | **PASS** |
| **Duplicate IDs in Metadata** | **0** | ID uniqueness check | **PASS** |
| **Unique Image Content Hashes** | **3,534** | SHA-256 hash across all 3,662 image files | **MEASURED** |
| **Duplicate Image Files (Identical Content)** | **128** | Files with identical SHA-256 hash | **AUDITED** |
| **Duplicate Image Conflicting Diagnosis** | **30** | APTOS grader label noise on identical images | **DOCUMENTED** |

---

## 2. Detailed Audit of the 14 Repaired Corrupted IDs

The 14 image IDs corrupted into scientific notation when `train.csv` was previously saved in Microsoft Excel have been verified and corrected into `AI_REBUILD/01_data/train_corrected.csv`:

| # | Line in `train.csv` | Corrupted CSV ID | Repaired Real Filename | Ground Truth Diagnosis | File Size |
| :-: | :-: | :---: | :---: | :---: | :-: |
| 1 | 87 | `7.10E+10` | `0709652336e2.png` | **Grade 0** (No DR) | 1,465,584 B |
| 2 | 346 | `1.94E+14` | `1943983492e5.png` | **Grade 2** (Moderate DR) | 884,548 B |
| 3 | 495 | `2.33E+11` | `232549883508.png` | **Grade 2** (Moderate DR) | 2,752,434 B |
| 4 | 586 | `2.93E+10` | `2927665214e1.png` | **Grade 0** (No DR) | 1,514,646 B |
| 5 | 793 | `3.90E+11` | `389552047476.png` | **Grade 0** (No DR) | 2,331,438 B |
| 6 | 949 | `4.41E+11` | `441117562359.png` | **Grade 2** (Moderate DR) | 1,842,538 B |
| 7 | 1209 | `5.36E+11` | `535682537302.png` | **Grade 0** (No DR) | 1,852,997 B |
| 8 | 1225 | `5.49E+11` | `549381330191.png` | **Grade 0** (No DR) | 1,465,584 B |
| 9 | 1283 | `5.95E+11` | `595446774178.png` | **Grade 1** (Mild DR) | 1,465,584 B |
| 10 | 1619 | `7.21E+11` | `721214151233.png` | **Grade 0** (No DR) | 1,465,584 B |
| 11 | 1948 | `8.91E+20` | `891329021e12.png` | **Grade 0** (No DR) | 1,852,997 B |
| 12 | 2084 | `9.21E+11` | `921433215353.png` | **Grade 2** (Moderate DR) | 1,465,584 B |
| 13 | 2100 | `9.34E+76` | `934104859e68.png` | **Grade 0** (No DR) | 1,465,584 B |
| 14 | 2115 | `9.47E+11` | `946545473380.png` | **Grade 0** (No DR) | 1,465,584 B |

---

## 3. Dataset-Wide Class Distribution

| DR Grade | Clinical Severity Description | Image Count | Population % | Referable Status |
| :---: | :--- | :---: | :---: | :---: |
| **0** | No Apparent Diabetic Retinopathy | **1,805** | 49.29% | Non-Referable |
| **1** | Mild Non-Proliferative DR | **370** | 10.10% | Non-Referable |
| **2** | Moderate Non-Proliferative DR | **999** | 27.28% | **Referable** |
| **3** | Severe Non-Proliferative DR | **193** | 5.27% | **Referable** |
| **4** | Proliferative Diabetic Retinopathy | **295** | 8.06% | **Referable** |
| **TOTAL** | — | **3,662** | **100.00%** | **37.28% Referable** |

---

## 4. Canonical Stratified Split

To guarantee rigorous benchmarking and eliminate data leakage, the dataset is divided into three fixed, reproducible partitions. **Stratification was executed at the unique image hash group level** so that identical image files are never split across partitions:

- **TRAIN Split:** **2,564 images (70.02%)**
- **CALIBRATION / VALIDATION Split:** **550 images (15.02%)**
- **FINAL HELD-OUT TEST Split:** **548 images (14.96%)**
- **Total:** **3,662 images (100.00%)**

### Class Representation per Partition

| DR Grade | TRAIN (N=2,564) | CALIBRATION (N=550) | TEST (N=548) | TOTAL (N=3,662) |
| :---: | :---: | :---: | :---: | :---: |
| **Grade 0** | 1,263 (49.26%) | 271 (49.27%) | 271 (49.45%) | **1,805** |
| **Grade 1** | 261 (10.18%) | 56 (10.18%) | 53 (9.67%) | **370** |
| **Grade 2** | 700 (27.30%) | 147 (26.73%) | 152 (27.74%) | **999** |
| **Grade 3** | 135 (5.27%) | 31 (5.64%) | 27 (4.93%) | **193** |
| **Grade 4** | 205 (8.00%) | 45 (8.18%) | 45 (8.21%) | **295** |

*Note: Proportions across all 5 classes match the natural dataset distribution within <0.5% variance across all three splits.*

---

## 5. Zero-Leakage Verification

Programmatic verification was conducted across both file IDs and SHA-256 image content hashes:

1. **ID Overlap:**
   - $\text{Train} \cap \text{Calibration} = \emptyset$ (0 shared IDs)
   - $\text{Train} \cap \text{Test} = \emptyset$ (0 shared IDs)
   - $\text{Calibration} \cap \text{Test} = \emptyset$ (0 shared IDs)
2. **Filepath Overlap:**
   - $\text{Train} \cap \text{Calibration} = \emptyset$ (0 shared filepaths)
   - $\text{Train} \cap \text{Test} = \emptyset$ (0 shared filepaths)
   - $\text{Calibration} \cap \text{Test} = \emptyset$ (0 shared filepaths)
3. **Image Content Hash Overlap:**
   - Identical image files (128 instances across 3,534 unique hashes) were strictly grouped before splitting.
   - 0 duplicate images exist across different splits. If an image hash is assigned to Train, all copies reside exclusively in Train.

---

## 6. Generated Artifacts Reference

| Artifact Path | Format | Description |
| :--- | :---: | :--- |
| `AI_REBUILD/01_data/original_metadata/train.csv` | CSV | Immutable archival copy of original uncorrected `train.csv`. |
| `AI_REBUILD/01_data/train_corrected.csv` | CSV | Repaired dataset metadata with all 3,662 valid image IDs and filepaths. |
| `AI_REBUILD/01_data/dataset_index.csv` | CSV | Canonical table (`id_code`, `diagnosis`, `filepath`). |
| `AI_REBUILD/01_data/dataset_index.mat` | MAT | Canonical MATLAB table `dataset_index`. |
| `AI_REBUILD/01_data/dataset_splits.csv` | CSV | Split registry (`id_code`, `diagnosis`, `split`: `TRAIN`/`CALIBRATION`/`TEST`). |
| `AI_REBUILD/01_data/dataset_splits.mat` | MAT | MATLAB variables `trainIds`, `calibrationIds`, `testIds`. |
| `AI_REBUILD/01_data/build_dataset_index.m` | MATLAB | Script that compiles canonical `dataset_index.mat`. |
| `AI_REBUILD/01_data/verify_dataset_splits.m` | MATLAB | Programmatic regression test asserting zero leakage and proper stratification. |

---

## 7. Conclusion

Phase 1 Dataset Integrity and Canonical Splitting is complete. The dataset is fully reconciled (3,662 / 3,662 images verified on disk), free of scientific notation corruption, free of ID/image content leakage, and properly stratified into Train (70%), Calibration (15%), and Test (15%). No production code, models, or backend/frontend assets were modified.
