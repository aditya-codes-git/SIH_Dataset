# RetinoScan AI — IDRiD Lesion Segmentation Schema Specification

**File:** `IDRID_SEGMENTATION_SCHEMA.md`  
**Parent Directory:** `AI_REBUILD/07_retinal_analysis/lesion_engine/`  
**Purpose:** Formal schema definition for the canonical pixel-level lesion segmentation index (`idrid_segmentation_index.csv`).

---

## 1. Canonical Segmentation Index Schema (`idrid_segmentation_index.csv`)

The canonical segmentation index links every original fundus photograph to its official challenge partition and ground truth lesion masks:

| Field Name | Type | Allowed Values | Null / Absent Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `image_id` | String | `IDRiD_[0-9]{2}` | *None (Primary Key)* | Unique image identifier (`IDRiD_01` to `IDRiD_81`). |
| `image_path` | String | Valid absolute path | *None* | Path to original RGB fundus photograph ($4288 \times 2848$). |
| `official_split` | Enum | `TRAIN`, `TEST` | *None* | Official IDRiD partition ($N=54$ Train, $N=27$ Test). |
| `image_width` | Integer | `4288` | *None* | Native image width in pixels. |
| `image_height` | Integer | `2848` | *None* | Native image height in pixels. |
| `image_channels` | Integer | `3` | *None* | Number of color channels (24-bit TrueColor RGB). |
| `ma_mask_path` | String | Valid TIFF path or `NA` | `NA` | Absolute path to Microaneurysm ground truth mask. |
| `he_mask_path` | String | Valid TIFF path or `NA` | `NA` | Absolute path to Haemorrhage ground truth mask. |
| `ex_mask_path` | String | Valid TIFF path or `NA` | `NA` | Absolute path to Hard Exudate ground truth mask. |
| `se_mask_path` | String | Valid TIFF path or `NA` | `NA` | Absolute path to Soft Exudate ground truth mask. |
| `optic_disc_mask_path` | String | Valid TIFF path or `NA` | `NA` | Absolute path to Optic Disc ground truth mask. |
| `ma_mask_present` | Boolean | `true, false` | `false` | True if Microaneurysm mask file exists. |
| `he_mask_present` | Boolean | `true, false` | `false` | True if Haemorrhage mask file exists. |
| `ex_mask_present` | Boolean | `true, false` | `false` | True if Hard Exudate mask file exists. |
| `se_mask_present` | Boolean | `true, false` | `false` | True if Soft Exudate mask file exists. |
| `optic_disc_mask_present` | Boolean | `true, false` | `false` | True if Optic Disc mask file exists. |
| `ma_foreground_pixels` | Integer | $\ge 0$ | `0` | Number of positive microaneurysm pixels. |
| `he_foreground_pixels` | Integer | $\ge 0$ | `0` | Number of positive hemorrhage pixels. |
| `ex_foreground_pixels` | Integer | $\ge 0$ | `0` | Number of positive hard exudate pixels. |
| `se_foreground_pixels` | Integer | $\ge 0$ | `0` | Number of positive soft exudate pixels. |
| `optic_disc_foreground_pixels`| Integer | $\ge 0$ | `0` | Number of positive optic disc pixels. |

---

## 2. Partition Constraints & Governance Rules

1. **Official Split Invariance:** The official 54-image training and 27-image testing partition defined by IEEE Dataport is preserved without alteration. Random re-partitioning is prohibited.
2. **APTOS Isolation:** IDRiD segmentation images and masks must never be merged into the APTOS train/validation/test sets.
3. **Evaluation Integrity:** The 27-image testing set must strictly remain held-out for final model benchmarking and never used for threshold tuning or model training.
