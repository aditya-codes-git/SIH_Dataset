# RetinoScan AI — Baseline System Report & Safety Rollback Snapshot

**Snapshot Timestamp:** September 20, 2026 (01:36 IST)  
**Git Checkpoint Tag:** `baseline-safety-snapshot` (Commit `4d1083d0e365591059d3dea8d6734fcbb8f7ae8b`)  
**Repository Working Directory:** `d:\SIH_Dataset`  
**Purpose:** Comprehensive pre-upgrade system audit, safety snapshot, build verification, and rollback registry before initiating any changes to the AI/ML pipeline.

---

## 1. System Inventory and SHA-256 Checksums

### 1.1. Model Weights & Serialized Networks

| File Name | File Size | SHA-256 Checksum | Purpose / Role | Rollback Status |
| :--- | :---: | :--- | :--- | :--- |
| `trained_dr_model.mat` | 41,687,182 B | `5703793438bdf5fdf59c106ed5c99104eaf4b27daa236483aa8646b95e6e812a` | Initial baseline ResNet-18 model. | Production fallback |
| `trained_dr_model_backup.mat` | 41,687,182 B | `5703793438bdf5fdf59c106ed5c99104eaf4b27daa236483aa8646b95e6e812a` | Exact bitwise clone of initial baseline model. | **IMMUTABLE ARCHIVE** |
| `trained_dr_model_preprocessed.mat` | 41,686,587 B | `55e3a458f4ccf8febdc967c4a1a9b2d884716c7d1e59e7d41ac9eedd8788c944` | Current active model (ResNet-18 + Ben Graham). | Current Primary |
| `dr_network.mat` | 41,677,161 B | `58ff06e5ef3f3573de726c1755c407387f60de64bcc283dbd29f98834eff5460` | Pre-training ResNet-18 LayerGraph definition. | Architecture blueprint |
| `baseline_eval_metrics.mat` | 333 B | `34e405626aaeb2e1f40d6961ea1fc3a5a7efd18d4df7fa7fe39665bc7f4c0297` | Evaluation metrics for baseline model. | Metric archive |
| `model_comparison_results.mat` | 695 B | `111589139f75ec5a4b11f7c32491aeb6c4fc62aeb28dd177ec483ae5d5a71bb3` | Head-to-head metrics comparing baseline vs preprocessed. | Metric archive |

### 1.2. Datasets on Disk
- `train_images/`: 3,662 files (all `.png`), total size ~8.3 GB. **READ-ONLY / IMMUTABLE**.
- `processed_train_images/`: 3,662 files (all `.png`), preprocessed Ben Graham images (224×224). **PRESERVED**.
- `train.csv`: 3,662 data rows + header.

---

## 2. Pipeline Entry Points & Execution Trace

### 2.1. Call Chain
```
[Frontend UI: React 19]
   │
   ▼ HTTP POST /api/screenings (multipart/form-data)
[Backend Express Controller: screeningController.createScreening]
   │
   ▼ Node.js Service: matlabService.runScreening(imagePath, screeningId)
[Backend Process Wrapper: matlabRunner.runMatlabScreening]
   │ Spawns CLI: matlab -batch "addpath(...); runScreeningFromFile(...)"
   ▼
[MATLAB Entry Point: runScreeningFromFile.m]
   │ Reads image: img = imread(inputPath)
   ▼
[Core MATLAB Screening Pipeline: drScreen.m]
   ├── 1. imageQualityCheck(img) -> [gradable, reason, focusScore, brightness, fovRatio]
   │      (If ~gradable: returns early with status: "UNGRADABLE")
   ├── 2. preprocessFundusKaggle(img, [224 224]) -> imgPreprocessed
   ├── 3. classify(trainedNet, imgPreprocessed) -> [predictedClass, scores]
   ├── 4. Referral decision: referable = (grade >= 2)
   └── 5. gradCAM(trainedNet, imgPreprocessed, predictedClass) -> scoreMap
   │
   ▼ Post-processing & Visualization (runScreeningFromFile.m)
[Export to Disk & Return]
   ├── Exports Grad-CAM overlay to: backend/uploads/gradcam/<uuid>_gradcam.png
   └── Writes JSON result to: backend/uploads/results/<uuid>_result.json
```

### 2.2. Public MATLAB Function Signatures

All callers expect these exact function signatures:

1. **`drScreen.m`:**
   ```matlab
   function result = drScreen(img)
   ```
   - Input: `img` — uint8 or double image matrix ($H \times W \times C$)
   - Return struct fields:
     - `status`: string (`"GRADABLE"` or `"UNGRADABLE"`)
     - `quality`: struct (`gradable`, `reason`, `focusScore`, `brightness`, `fovRatio`)
     - *(If UNGRADABLE)*: `message` (`"Please recapture the retinal image."`)
     - *(If GRADABLE)*: `grade` (double), `predictedClass` (categorical/string), `confidence` (double), `referable` (logical), `referral` (string), `scoreMap` (2D double), `processedImage` (224×224×3 double)

2. **`runScreeningFromFile.m`:**
   ```matlab
   function runScreeningFromFile(inputPath, outputPath, gradcamPath)
   ```
   - Inputs: Absolute file paths as character vectors or strings.
   - Output: Serializes JSON to `outputPath`, saves raster overlay to `gradcamPath`.

3. **`imageQualityCheck.m`:**
   ```matlab
   function [gradable, reason, focusScore, brightness, fovRatio] = imageQualityCheck(img)
   ```
   - Inputs: `img` ($H \times W \times 3$ or grayscale)
   - Outputs: `gradable` (bool), `reason` (string), `focusScore` (double), `brightness` (double), `fovRatio` (double).

4. **`preprocessFundusKaggle.m`:**
   ```matlab
   function enhancedImg = preprocessFundusKaggle(img, targetSize)
   ```
   - Inputs: `img`, optional `targetSize` (default: `[224 224]`).
   - Output: `enhancedImg` ($224 \times 224 \times 3$ uint8 in $[0, 255]$).

---

## 3. Data Contracts and Schemas

### 3.1. MATLAB Output JSON Schema (`result.json`)

**Gradable Contract:**
```json
{
  "status": "GRADABLE",
  "quality": {
    "gradable": true,
    "reason": "Image quality acceptable. Proceed to DR screening.",
    "focusScore": 0.00013289657503073293,
    "brightness": 0.20139522684675956,
    "fovRatio": 0.745628860612667
  },
  "grade": 0,
  "predictedClass": "0",
  "confidence": 0.9502028226852417,
  "referable": false,
  "referral": "NON-REFERABLE DR",
  "gradcamPath": "d:/SIH_Dataset/backend/uploads/gradcam/<uuid>_gradcam.png"
}
```

**Ungradable Contract:**
```json
{
  "status": "UNGRADABLE",
  "quality": {
    "gradable": false,
    "reason": "Poor focus / blurry image; Poor illumination",
    "focusScore": 0.000012,
    "brightness": 0.04,
    "fovRatio": 0.32
  },
  "message": "Please recapture the retinal image."
}
```

### 3.2. MongoDB Screening Model Schema (`backend/src/models/Screening.js`)

```javascript
{
  screeningId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, default: 'PATIENT-ANONYMOUS', index: true },
  patientName: { type: String, default: 'Anonymous Patient' },
  age: { type: Number, default: null },
  gender: { type: String, default: 'Unspecified' },
  diabetesDuration: { type: String, default: 'Not specified' },
  contactLocation: { type: String, default: 'Rural Screening Camp' },
  originalImagePath: { type: String, required: true },
  status: { type: String, required: true, enum: ['GRADABLE', 'UNGRADABLE', 'FAILED'] },
  quality: {
    gradable: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    focusScore: { type: Number, default: 0 },
    brightness: { type: Number, default: 0 },
    fovRatio: { type: Number, default: 0 }
  },
  drGrade: { type: Number, default: null },
  predictedClass: { type: String, default: null },
  confidence: { type: Number, default: null },
  referable: { type: Boolean, default: null },
  referral: { type: String, default: null },
  triage: {
    referralRequired: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ['ROUTINE', 'MEDIUM', 'HIGH', 'URGENT', 'RECAPTURE_REQUIRED'],
      default: 'ROUTINE'
    },
    routing: {
      type: String,
      enum: ['ROUTINE_FOLLOW_UP', 'OPHTHALMOLOGIST_REVIEW', 'RECAPTURE'],
      default: 'ROUTINE_FOLLOW_UP'
    },
    status: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING_REVIEW', 'UNDER_REVIEW', 'REVIEWED', 'COMPLETED', 'UNGRADABLE'],
      default: 'NOT_REQUIRED'
    }
  },
  gradcamImagePath: { type: String, default: null },
  message: { type: String, default: null },
  humanReview: {
    reviewed: { type: Boolean, default: false },
    reviewer: { type: String, default: null },
    decision: { type: String, default: null },
    notes: { type: String, default: null },
    clinicalFindings: { type: String, default: null },
    recommendations: { type: String, default: null },
    reviewedAt: { type: Date, default: null }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3.3. Frontend Expectations

- **Operator Workstation:** Receives sanitized payload (`roleSanitizer.js` hides `drGrade`, `confidence`, and `gradcamUrl` to prevent operator diagnostic bias). Expects `status`, `quality.reason`, `quality.gradable`, and `triage.routing`.
- **Doctor Workstation:** Receives full clinical payload including `drGrade` (0–4), `confidence` (float in $[0, 1]$ displayed as `(confidence * 100).toFixed(1)%`), `referable` (boolean), `referral` (string), `gradcamUrl` (static image path), and `quality` metrics.
- **Critical Frontend Gap:** Frontend UI components (`ModelResultCard.jsx`, `ScreeningResult.jsx`) currently only display a single `confidence` metric. There is no probability distribution chart because `scores` was never provided by MATLAB.

---

## 4. Test & Build Verification Results

| Verification Suite | Target Component | Status | Details / Result |
| :--- | :--- | :---: | :--- |
| **Frontend Production Build** | Vite 8.2.2 / React 19 (`frontend/`) | **PASS** | `npm run build` exited with Code 0 in 6.59s. Output assets created in `dist/`. |
| **Backend Code Syntax Audit** | Node.js (`backend/src/` & `tests/`) | **PASS** | 22/22 JavaScript source files passed strict AST syntax check (`node -c`). |
| **Backend API Health Check** | Express / MongoDB / MATLAB Bridge | **PASS** | `GET /api/health` returned HTTP 200 `{ status: "OK", database: { status: "CONNECTED" }, matlabModel: { status: "READY" } }`. |
| **Workflow Hardening Test** | `tests/workflowHardeningVerification.js` | **PASS** | **24/24 passed**: Role barriers, eligibility, idempotency, MongoDB immutability. |
| **Queue End-to-End Test** | `tests/queueEndToEndVerification.js` | **PASS** | **30/30 passed**: Queue data flow, triage rules, sorting, pagination, role sanitization. |
| **MATLAB Inference Verification** | `test_deployed_pipeline.m` | **VERIFIED** | Regression test on Grade-2 case `000c1434d8d7.png` passed (`Grade: 2`, `Confidence: 99.18%`, `Referable: 1`). Solid-black image correctly failed IQA hard gate with `status: UNGRADABLE`. |

---

## 5. Documented Known Failures & Architectural Limitations

1. **Catastrophic Baseline Model Collapse (`trained_dr_model.mat`):**  
   The original model collapsed to 100% Grade 0 predictions. Grade $\ge$ 2 sensitivity is 0.00%.
2. **High-Grade Confusion in Preprocessed Model (`trained_dr_model_preprocessed.mat`):**  
   While accuracy is 80.41%, Grade 3 has only 23.1% recall (25/39 severe cases misclassified as Grade 2).
3. **5-Class Softmax Dropped at Inference:**  
   `drScreen.m` computes `scores` via `classify()` but discards it, returning only `confidence = max(scores)`.
4. **"Calibrated Softmax" is Technically Unjustified:**  
   No calibration exists in the entire repository.
5. **Excel Scientific Notation Corruption in `train.csv`:**  
   14 image IDs (e.g. `'0709652336e2'`) were converted to scientific notation (`'7.10E+10'`), causing training and preprocessing scripts to drop them.
6. **Absence of Retinal Lesion Detection:**  
   Optic disc detection, macula localization, vessel segmentation, microaneurysm detection, and hemorrhage segmentation are 100% absent.
7. **Coarse 7×7 Grad-CAM:**  
   Default Grad-CAM targets the final ResNet-18 convolutional layer at 7×7 resolution overlaid with a 35% jet colormap onto a 224×224 Ben Graham image.

---

## 6. Safety & Rollback Strategy

### 6.1. Immutable Reference Points
- **Git Safety Tag:** `baseline-safety-snapshot` (Commit `4d1083d0e365591059d3dea8d6734fcbb8f7ae8b`).
- **Archive Copy:** `trained_dr_model_backup.mat` is NEVER overwritten.
- **Source Code Archive:** `AI_PIPELINE_SOURCE/` contains exact pre-upgrade copies of all 14 `.m` files, `train.csv`, `result.json`, and backend deployment scripts.

### 6.2. Dual-Model Runtime Fallback
The entry point `drScreen.m` implements dynamic model fallback:
```matlab
modelFile = 'trained_dr_model_preprocessed.mat';
if ~exist(modelFile, 'file')
    modelFile = 'trained_dr_model.mat';
end
load(modelFile, 'trainedNet');
```
Any new model will be saved to a new file (e.g., `trained_dr_model_v2.mat`), tested against regression suites, and only activated once verified.

### 6.3. Rollback Procedure
If any unexpected regression occurs during the upgrade:
1. Revert modified `.m` files from `AI_PIPELINE_SOURCE/04_inference/` or `git checkout baseline-safety-snapshot`.
2. Delete experimental `.mat` model files.
3. Restart the Node.js backend server (`npm start` in `backend/`).

---

## 7. Files Slated for Additive Changes in Later Phases

| Target File | Change Nature | Additive Modifications Planned |
| :--- | :--- | :--- |
| `train.csv` | **Bugfix** | Restore the 14 corrupted scientific notation IDs back to their authentic hexadecimal strings. |
| `drScreen.m` | **Additive Upgrade** | Add `result.probabilities = double(scores);`. Upgrade Grad-CAM targeting and high-resolution overlay. |
| `runScreeningFromFile.m` | **Additive Upgrade** | Include `response.probabilities = result.probabilities;` in `result.json`. |
| `backend/src/models/Screening.js` | **Additive Upgrade** | Add optional field `probabilities: [Number]` (default: `[]`). |
| `backend/src/services/matlab/matlabService.js` | **Additive Upgrade** | Map `matlabData.probabilities` $\rightarrow$ `screeningResult.probabilities`. |
| `backend/src/utils/roleSanitizer.js` | **Additive Upgrade** | Include `probabilities` in Doctor payload. |
| `imageQualityCheck.m` | **Additive Upgrade** | Add circular fundus boundary mask before brightness and sharpness computations. |
| `AI_REBUILD/02_training/` | **New Files Only** | Clean retraining scripts with data augmentation, class weighting, and QWK optimization. |
| `AI_REBUILD/04_calibration/` | **New Files Only** | Post-hoc temperature scaling and ECE calculation scripts. |
| `AI_REBUILD/07_retinal_analysis/`| **New Files Only** | Optic disc, fovea, and candidate lesion segmentation modules. |

---

*Report certified as an accurate baseline snapshot. AI upgrade phase may now proceed safely.*
