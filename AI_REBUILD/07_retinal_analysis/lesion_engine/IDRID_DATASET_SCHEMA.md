# RetinoScan AI — IDRiD Ingestion Schema Specification

**File:** `IDRID_DATASET_SCHEMA.md`  
**Parent Directory:** `AI_REBUILD/07_retinal_analysis/lesion_engine/`  
**Purpose:** Formal schema definition for canonical index and split tables produced by Phase 6A ingestion.

---

## 1. Canonical Index Schema (`idrid_index.csv`)

The canonical index table provides a 1-to-1 mapping between every fundus photograph in the IDRiD dataset and its corresponding metadata and annotations.

| Field Name | Type | Allowed Values | Null / Absent Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `imageId` | String | `IDRiD_[0-9]{3}(test)?` | *None (Primary Key)* | Unique identifier matching the photograph base filename. |
| `imagePath` | String | Valid absolute path | *None* | Path to the raw high-resolution photograph ($4288 \times 2848$). |
| `diagnosis` | Integer | `0, 1, 2, 3, 4` | `NaN` | Clinical diabetic retinopathy severity grade. |
| `macularEdemaRisk` | Integer | `0, 1, 2` | `NaN` | Clinical diabetic macular edema risk level. |
| `microaneurysmMask` | String | Path or `NA` | `NA` | Path to binary microaneurysm segmentation mask. |
| `hemorrhageMask` | String | Path or `NA` | `NA` | Path to binary hemorrhage segmentation mask. |
| `hardExudateMask` | String | Path or `NA` | `NA` | Path to binary hard exudate segmentation mask. |
| `softExudateMask` | String | Path or `NA` | `NA` | Path to binary cotton-wool spot segmentation mask. |
| `opticDiscMask` | String | Path or `NA` | `NA` | Path to binary optic disc segmentation mask. |
| `foveaX` | Float | `[1, 4288]` | `NaN` | Foveal center X-coordinate in native camera pixels. |
| `foveaY` | Float | `[1, 2848]` | `NaN` | Foveal center Y-coordinate in native camera pixels. |
| `opticDiscX` | Float | `[1, 4288]` | `NaN` | Optic disc center X-coordinate in native camera pixels. |
| `opticDiscY` | Float | `[1, 2848]` | `NaN` | Optic disc center Y-coordinate in native camera pixels. |
| `imageWidth` | Integer | `4288` | *None* | Native horizontal pixel count. |
| `imageHeight` | Integer | `2848` | *None* | Native vertical pixel count. |

---

## 2. Dataset Splits Schema (`idrid_splits.csv`)

The dataset splits table defines the zero-leakage partition of images for training, validation, and testing.

| Field Name | Type | Allowed Values | Description |
| :--- | :--- | :--- | :--- |
| `imageId` | String | `IDRiD_[0-9]{3}(test)?` | Unique identifier matching `idrid_index.csv`. |
| `split` | Enum | `TRAIN`, `VALIDATION`, `TEST` | Designated dataset partition (70% Train, 15% Val, 15% Test). |

### Integrity Rules
1. **Uniqueness:** Every `imageId` appears exactly once in `idrid_splits.csv`.
2. **Mutual Exclusivity:** $\text{Train} \cap \text{Validation} = \emptyset$, $\text{Train} \cap \text{Test} = \emptyset$, $\text{Validation} \cap \text{Test} = \emptyset$.
3. **Stratification:** DR grades 0 through 4 are proportionally partitioned across splits.
4. **Zero Classification Test Leakage:** The IDRiD splits are completely isolated from the held-out APTOS test set.
