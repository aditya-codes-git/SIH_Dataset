# RetinoScan AI — Environment Requirements Specification

## 1. Operating System & Hardware Baseline

| Attribute | Verified Host Specification | Minimum Requirement | Production Recommendation |
| :--- | :--- | :--- | :--- |
| **Operating System** | Windows 11 Home Single Language (Build 26200) | Windows 10/11 (64-bit) or Windows Server 2022 | Windows Server 2022 / Ubuntu 22.04 LTS (if compiled) |
| **Processor (CPU)** | Modern x86_64 Multi-Core (e.g. Intel Core i5/i7/i9 or AMD Ryzen) | 4 Cores, 2.5 GHz+ | 8+ Cores, 3.2 GHz+ |
| **System Memory (RAM)**| 16 GB Physical RAM | 16 GB RAM | 32 GB RAM (accommodates concurrent MATLAB instances) |
| **Dedicated GPU** | NVIDIA GeForce RTX 4050 Laptop GPU (6GB VRAM) | None (CPU fallback functional) | NVIDIA RTX 3060/4060 or Tesla T4 (>= 6GB VRAM, CUDA 12+) |
| **Local Disk Storage**| NVMe SSD (>= 50 GB free space) | 20 GB free space | 100 GB+ High-Speed NVMe (MATLAB ~20GB + model weights + patient uploads) |

---

## 2. Frontend Environment (React + Vite)

### 2.1 Software & Tooling
- **Node.js**: v18.0.0+ LTS, v20.x, or v25.x (Verified active: `v25.2.1`)
- **Package Manager**: npm v9.0.0+ (Verified active: `v11.6.2`)
- **Build Engine**: Vite v8.2.2 with `@vitejs/plugin-react` v6.1.0
- **Bundle Output**: Single Page Application in `frontend/dist/`
  - `dist/index.html` (~0.45 kB)
  - `dist/assets/index-*.css` (~3.95 kB)
  - `dist/assets/index-*.js` (~724 kB minified)

### 2.2 Core Dependencies
- `react`: `^19.2.8`
- `react-dom`: `^19.2.8`
- `framer-motion`: `^13.2.0`
- `lucide-react`: `^1.39.0`
- `recharts`: `^3.10.1`

### 2.3 Environment Variables
| Variable Name | Required? | Default / Example Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **YES** | `http://127.0.0.1:5000/api` (Dev)<br>`https://api.retinoscan.ai/api` (Prod) | Absolute or relative URL prefix targeting the Express backend API. |

---

## 3. Backend Environment (Node.js + Express API Bridge)

### 3.1 Software & Tooling
- **Runtime**: Node.js v18.0.0+ LTS (Tested: `v25.2.1`)
- **Execution Mode**: CommonJS (`require`)
- **Process Supervision**: `nodemon` (Development) / `pm2` or Windows Service (Production)
- **Startup Command**: `node src/server.js`

### 3.2 Production npm Dependencies
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `express` | `^4.19.2` | Core HTTP REST routing engine |
| `cors` | `^2.8.5` | Cross-Origin Resource Sharing |
| `helmet` | `^7.1.0` | Security headers (configured with CORP `cross-origin`) |
| `mongoose` | `^8.4.1` | MongoDB Object Data Modeling (ODM) |
| `multer` | `^1.4.5-lts.1` | Multipart form-data parser for retinal image uploads |
| `dotenv` | `^16.4.5` | Environment variable loader from `.env` |
| `morgan` | `^1.10.0` | HTTP request logging |
| `uuid` | `^9.0.1` | UUIDv4 generation for deterministic `screeningId` tagging |

### 3.3 System Permissions & Execution Privileges
- **Process Spawn Permission**: Child process execution permission to launch `matlab.exe` via `child_process.exec()`.
- **Filesystem Write Privileges**: Read/write/create directory access in `backend/uploads/` (`original/`, `gradcam/`, `results/`).
- **Network Permissions**: Outbound TCP access to MongoDB port (default 27017 or Atlas cloud port 27017) and inbound HTTP on specified `PORT`.

### 3.4 Backend Environment Variables
| Variable Name | Required? | Default / Verified Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | Local network port for Express HTTP listener. Automatically set by container/cloud platforms. |
| `MONGODB_URI` | **YES** | `mongodb://127.0.0.1:27017/diabetic_retinopathy` | MongoDB connection URI (local instance or MongoDB Atlas cluster connection string). |
| `MATLAB_CMD` | Optional | `matlab` | Shell executable name or full binary path to invoke MATLAB CLI. |
| `NODE_ENV` | Optional | `development` | Environment mode (`production` disables verbose traces). |

---

## 4. MATLAB Runtime & Model Requirements

### 4.1 Release & License Verification
- **Verified MATLAB Release**: **MATLAB Version 26.1.0.3346908 (R2026a) Update 5**
- **Verified License Number**: 40924685
- **Verified Product Components**:
  - `MATLAB` Version 26.1 (R2026a)
  - `Simulink` Version 26.1 (R2026a)
  - `Deep Learning Toolbox` Version 26.1 (R2026a) — *Actively used for neural network inference & Grad-CAM*
  - `Image Processing Toolbox` — *Actively used for image morphology, segmentation, filtering, and IO*
  - `Parallel Computing Toolbox` Version 26.1 (R2026a) — *Actively used for GPU acceleration*
- **Compiler / SDK Status**:
  - `license('test', 'Compiler')`: `1` (License available)
  - `license('test', 'Compiler_SDK')`: `0` (Not licensed)
  - `exist('mcc', 'file')`: `0` (MATLAB Compiler product binaries are **NOT installed** on host)

### 4.2 Required Model Weights & Parameter Files
The following four binary `.mat` artifacts are mandatory and must be present on the host filesystem:

| File Relative Path | Size | Description |
| :--- | :--- | :--- |
| `trained_dr_model_preprocessed.mat` | 41.69 MB | Primary ResNet-18 DR 5-class classification network |
| `AI_REBUILD/02_training/models/trained_dr_model_r18_final_candidate.mat` | 41.69 MB | Final candidate model for Phase 4.5 high-resolution multi-scale Grad-CAM |
| `AI_REBUILD/04_calibration/calibration_parameters.mat` | 5.0 KB | Temperature scaling parameter ($T = 1.0504$) and ECE validation metrics |
| `AI_REBUILD/07_retinal_analysis/lesion_engine/segmentation_training/models/best_lesion_unet.mat` | ~30 MB | 4-channel U-Net segmentation model for Microaneurysms, Haemorrhages, Hard Exudates, and Soft Exudates |
| **Total Weight Footprint** | **~114 MB** | All models stored locally in repository structure |

### 4.3 Required MATLAB Search Paths
When `matlabRunner.js` invokes MATLAB, it executes `addpath(...)` on the workspace root. `runScreeningFromFile.m` and `runFullRetinalAnalysis.m` dynamically add the following subdirectories:
- `<WORKSPACE_ROOT>`
- `<WORKSPACE_ROOT>/AI_REBUILD/06_explainability`
- `<WORKSPACE_ROOT>/AI_REBUILD/07_retinal_analysis`
- `<WORKSPACE_ROOT>/AI_REBUILD/07_retinal_analysis/lesion_engine/inference`
- `<WORKSPACE_ROOT>/AI_REBUILD/07_retinal_analysis/lesion_engine/visualization`
- `<WORKSPACE_ROOT>/AI_REBUILD/04_calibration`
- `<WORKSPACE_ROOT>/AI_REBUILD/02_training`

### 4.4 GPU & Compute Requirements
- **GPU Acceleration**:
  - If CUDA-capable GPU is present (`gpuDeviceCount > 0`), U-Net patch evaluation executes on `gpuArray`.
  - Typical inference latency with GPU: **1.8 – 3.5 seconds**.
- **CPU Fallback**:
  - If no GPU is found, `predictLesions.m` automatically switches to CPU evaluation.
  - Typical inference latency on CPU: **18 – 45 seconds** (due to ~80 overlapping 256x256 patch evaluations).
  - Timeout safety: `matlabRunner.js` enforces a 180-second (3-minute) timeout, which accommodates CPU inference.

---

## 5. Database Requirements (MongoDB / Atlas)

### 5.1 Connection & Versioning
- **Engine**: MongoDB Community Server 6.0+ or MongoDB Atlas (M0 Free Tier, M10+ Dedicated).
- **Driver**: Mongoose v8.4.1.
- **Connection Configuration**:
  - `serverSelectionTimeoutMS`: 5000 ms (gracefully avoids hung HTTP requests if DB offline).
  - Auto-reconnect enabled by default in Mongoose.

### 5.2 Automatic Schema Migrations
- On backend startup (`server.js`), after database connectivity is confirmed, `runIdempotentDataMigration()` executes automatically.
- Validates and repairs:
  1. Synchronizes `triage.status = 'REVIEWED'` for historical records where `humanReview.reviewed === true`.
  2. Populates missing `triage` blocks for legacy documents without altering original AI grades or confidence.
