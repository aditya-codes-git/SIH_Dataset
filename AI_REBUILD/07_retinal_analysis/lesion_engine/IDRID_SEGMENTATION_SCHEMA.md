# RetinoScan AI — IDRiD Lesion Segmentation Schema Specification

**File:** `IDRID_SEGMENTATION_SCHEMA.md`  
**Parent Directory:** `AI_REBUILD/07_retinal_analysis/lesion_engine/`  
**Purpose:** Formal schema definition for the canonical pixel-level lesion segmentation index (`idrid_segmentation_index.csv`).

---

## 1. Canonical Segmentation Index Schema (`idrid_segmentation_index.csv`)

| Field Name | Type | Allowed Values | Null / Absent Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `image_id` | String | `IDRiD_[0-9]{2}` | *None (Primary Key)* | Unique image identifier (e.g. `IDRiD_01` to `IDRiD_81`). |
| `image_path` | String | Valid absolute path | *None* | Path to original RGB fundus photograph ($4288 \times 2848$). |
| `official_split` | Enum | `TRAIN`, `TEST` | *None* | Official IDRiD challenge split ($N=54$ Train, $N=27$ Test). |
| `ma_mask_path` | String | Valid TIFF path or `NA` | `NA` | Binary ground truth mask for Microaneurysms. |
| `he_mask_path` | String | Valid TIFF path or `NA` | `NA` | Binary ground truth mask for Haemorrhages. |
| `ex_mask_path` | String | Valid TIFF path or `NA` | `NA` | Binary ground truth mask for Hard Exudates. |
| `se_mask_path` | String | Valid TIFF path or `NA` | `NA` | Binary ground truth mask for Soft Exudates. |
| `optic_disc_mask_path` | String | Valid TIFF path or `NA` | `NA` | Binary ground truth mask for Optic Disc. |
| `image_width` | Integer | `4288` | *None* | Native image width. |
| `image_height` | Integer | `2848` | *None* | Native image height. |
| `ma_pixel_count` | Integer | $\ge 0$ | `0` | Number of positive microaneurysm pixels. |
| `he_pixel_count` | Integer | $\ge 0$ | `0` | Number of positive hemorrhage pixels. |
| `ex_pixel_count` | Integer | $\ge 0$ | `0` | Number of positive hard exudate pixels. |
| `se_pixel_count` | Integer | $\ge 0$ | `0` | Number of positive soft exudate pixels. |
| `has_ma` | Boolean | `true, false` | `false` | True if at least one positive MA pixel exists. |
| `has_he` | Boolean | `true, false` | `false` | True if at least one positive HE pixel exists. |
| `has_ex` | Boolean | `true, false` | `false` | True if at least one positive EX pixel exists. |
| `has_se` | Boolean | `true, false` | `false` | True if at least one positive SE pixel exists. |
| `has_od` | Boolean | `true, false` | `false` | True if at least one positive OD pixel exists. |

---

## 2. Partition Constraints & Governance Rules

1. **Official Split Invariance:** The official 54-image training and 27-image testing partition defined by IEEE Dataport must be preserved without alteration. Random re-partitioning is prohibited.
2. **APTOS Isolation:** IDRiD segmentation images and masks must never be merged into the APTOS train/validation/test sets.
3. **Evaluation Integrity:** The 27-image testing set must strictly remain held-out for final model benchmarking and never used for threshold tuning or model training.
