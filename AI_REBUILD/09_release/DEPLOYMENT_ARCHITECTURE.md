# RetinoScan AI — Deployment Architecture Specification

## 1. System Overview & Component Topology

RetinoScan AI is a clinical AI screening system for Diabetic Retinopathy (DR) and macular risk assessment. The application consists of three primary tiers:

```
+-------------------------------------------------------------------------------+
|                                CLIENT TIER                                    |
|   React 19 + Vite SPA (Operator Screening Portal, Doctor Diagnostic Portal)   |
+-------------------------------------------------------------------------------+
                                     |
                         HTTP / REST | (JSON + Multipart Form-Data)
                                     v
+-------------------------------------------------------------------------------+
|                                API GATEWAY TIER                               |
|   Node.js (v25+) + Express.js API Bridge (Port 5000)                          |
|   - Multer Disk Storage (uploads/original)                                    |
|   - Auth & Role Guard Middleware (x-demo-role)                                |
|   - Triage Engine (SIH26038 Protocol)                                        |
|   - AI Explanatory Assistant Service                                          |
|   - Static Asset Streaming Endpoints (/api/files/*)                           |
+-------------------------------------------------------------------------------+
        |                                                       |
        | Mongoose Driver                                       | Child Process exec()
        v                                                       v
+-----------------------+              +----------------------------------------+
|    PERSISTENCE TIER   |              |          INFERENCE ENGINE TIER         |
|  MongoDB / Atlas      |              |  MATLAB R2026a CLI (-batch mode)       |
|  - Screenings         |              |  Entry: runScreeningFromFile.m         |
|  - Audit Log          |              |  - drScreen.m (IQA + ResNet-18)        |
|  - Clinical Reviews   |              |  - Multi-Scale Grad-CAM                |
+-----------------------+              |  - Temperature Calibration             |
                                       |  - Retinal Landmark Extraction         |
                                       |  - Lesion U-Net Tiled Segmentation     |
                                       |  Outputs: results/*.json, *.png        |
                                       +----------------------------------------+
```

---

## 2. Complete Runtime Dependency & Call Chain Trace

The execution lifecycle of a single screening request proceeds through the following sequential chain:

```
1. Client Browser
   | (POST /api/screenings with fundus image multipart upload)
   v
2. Node.js Express Gateway (app.js / server.js)
   | Routes to screeningRoutes.js -> screeningController.js
   | Multer stores raw image to backend/uploads/original/${screeningId}.png
   v
3. matlabService.js (Backend Service Layer)
   | Prepares deterministic filesystem targets:
   |   inputImagePath  = backend/uploads/original/${screeningId}.png
   |   outputJsonPath  = backend/uploads/results/${screeningId}_result.json
   |   gradcamPath     = backend/uploads/gradcam/${screeningId}_gradcam.png
   v
4. matlabRunner.js (Execution Layer)
   | Spawns OS child process via child_process.exec():
   | matlab -batch "addpath('D:/SIH_Dataset'); runScreeningFromFile('...','...','...');"
   | Timeout: 180,000 ms (3 minutes)
   v
5. MATLAB R2026a Engine & Script Execution (runScreeningFromFile.m)
   |-- Reads image via imread(inputPath)
   |-- Calls drScreen(img):
   |     |-- Step 1: imageQualityCheck.m (Focus variance, mean brightness, FOV ratio)
   |     |     --> If UNGRADABLE: sets status="UNGRADABLE", returns recapture message.
   |     |-- Step 2: preprocessFundusKaggle.m (Circular retinal crop + Ben Graham enhancement)
   |     |-- Step 3: DR Classification (classify() on trained_dr_model_preprocessed.mat)
   |     |-- Step 4: Referral Decision (drGrade >= 2 => REFERABLE DR)
   |     |-- Step 5: Baseline Grad-CAM (gradCAM.m)
   |-- If GRADABLE:
   |     |-- Phase 4.5 Multi-Scale Grad-CAM: generateImprovedGradCAM.m
   |     |     --> Loads trained_dr_model_r18_final_candidate.mat
   |     |-- Phase 3 Calibration: loads calibration_parameters.mat
   |     |     --> Calculates temperature-scaled probabilities & risk scores
   |     |-- Phase 5 & 6 Retinal & Lesion Analysis: runFullRetinalAnalysis.m
   |     |     |-- segmentRetinalField.m (Retinal boundary detection)
   |     |     |-- detectOpticDisc.m (Bright cluster Hough/radial transform)
   |     |     |-- estimateMacula.m (Geometric depression search)
   |     |     |-- analyzeRetinalVessels.m (Green-channel morphology)
   |     |     |-- extractCandidateFindings.m (Red/bright morphological candidates)
   |     |     |-- predictLesions.m (U-Net tiled inference on best_lesion_unet.mat)
   |     |     |-- postprocessLesionMasks.m (Calibrated dev thresholds)
   |     |     |-- extractLesionEvidence.m (Generates lesion counts & areas)
   |     |     |-- Renders visual overlays: original_fundus.png, gradcam_overlay.png,
   |     |     |   attention_points.png, retinal_landmarks.png, lesion_combined_overlay.png
   |     |     \-- Writes structured findings to retinal_analysis.json
   |-- jsonencode(response) -> Writes outputJsonPath
   v
6. matlabRunner.js (Completion & Parsing)
   | Verifies outputJsonPath exists on disk
   | Reads and parses JSON payload
   v
7. screeningController.js (Clinical Business Logic & Persistence)
   | Computes SIH26038 triage routing (calculateTriage)
   | Persists full clinical record to MongoDB (Screening model)
   | Sanitizes response according to user role (sanitizeScreening)
   v
8. Client Browser
   | Receives 201 Created with sanitized screening payload
   | Renders clinical grade, confidence, visual assets, and triage priority
```

---

## 3. Tier-by-Tier Deployment Analysis

### Tier 1: Frontend (React 19 + Vite)
- **Nature**: Pure client-side single page application (SPA).
- **Build Output**: Static HTML, CSS, JavaScript chunks in `frontend/dist/`.
- **Runtime Dependency**: Any standard static file server or CDN (Vercel, Netlify, Cloudflare Pages, Nginx).
- **Environment Parameter**: `VITE_API_BASE_URL`.

### Tier 2: Backend API Bridge (Node.js + Express)
- **Nature**: Stateless REST API handling JSON and file uploads, except for its coupling to local disk and MATLAB CLI.
- **Runtime Dependency**: Node.js 18+ LTS, writeable disk storage for uploads, network connectivity to MongoDB.
- **Environment Parameters**: `PORT`, `MONGODB_URI`, `MATLAB_CMD`.

### Tier 3: Inference Engine (MATLAB Pipeline)
- **Nature**: Heavy mathematical and deep learning inference scripts invoked via CLI batch mode.
- **Runtime Dependency**: Desktop MATLAB installation with licensed toolboxes (Deep Learning, Image Processing).
- **Hardware Dependency**: Multi-core CPU; NVIDIA GPU strongly recommended for tiled U-Net segmentation.
- **State/Filesystem**: Operates directly on the host filesystem via absolute and relative file paths.

---

## 4. Data Persistence & File Storage Topology

```
+---------------------------------------------------------------------------------+
| LOCAL DISK STORAGE ROOT (backend/uploads/)                                      |
+---------------------------------------------------------------------------------+
|  /original/             Raw uploaded patient retinal images                     |
|                         (${screeningId}.png / .jpg)                             |
|                                                                                 |
|  /gradcam/              High-resolution multi-scale Grad-CAM attention overlays |
|                         (${screeningId}_gradcam.png)                            |
|                                                                                 |
|  /results/              Structured analysis and lesion segmentation outputs:    |
|                         - ${screeningId}_result.json                            |
|                         - ${screeningId}_retinal_analysis.json                  |
|                         - ${screeningId}_vessel_mask.png                        |
|                         - ${screeningId}_attention_points.png                   |
|                         - ${screeningId}_retinal_landmarks.png                  |
|                         - ${screeningId}_lesion_combined_overlay.png            |
|                         - lesion_masks/${screeningId}_*.png                     |
+---------------------------------------------------------------------------------+
                                      |
                                      v Indexed By
+---------------------------------------------------------------------------------+
| MONGODB SCREENINGS COLLECTION                                                   |
+---------------------------------------------------------------------------------+
|  - screeningId (UUID, unique index)                                             |
|  - patientId, patientName, age, gender, contactLocation                         |
|  - status ("GRADABLE" | "UNGRADABLE")                                           |
|  - quality (focusScore, brightness, fovRatio, reason)                           |
|  - drGrade (0-4), predictedClass, confidence                                    |
|  - probabilities, calibratedProbabilities, referableRiskProbability             |
|  - triage (priority, routing, status)                                           |
|  - retinalAnalysis (nested landmarks, vessels, lesions, visual asset paths)     |
|  - humanReview (reviewer, decision, notes, clinicalFindings, reviewedAt)       |
+---------------------------------------------------------------------------------+
```

---

## 5. Architectural Bottlenecks & Limitations

1. **Process Forking Latency**: Every screening spawns a full `matlab -batch` process. The cold startup overhead of MATLAB R2026a on Windows is 10-18 seconds before execution starts.
2. **Ephemeral Disk Incompatibility**: The backend writes assets to `backend/uploads/`. Cloud container hosts (Render, Heroku) discard ephemeral disk on reboot, destroying medical images unless mounted to persistent network volumes or cloud object storage.
3. **Synchronous HTTP Blocking**: The screening HTTP request remains open while MATLAB executes (total duration ~15-35 seconds). A sudden connection drop from client timeout can leave orphan processes running.
4. **Hardcoded Localhost in Frontend**: Image asset URLs currently generate with hardcoded `http://127.0.0.1:5000` prefixes in `frontend/src/services/api.js`, breaking cross-host deployments.
