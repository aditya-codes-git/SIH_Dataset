# RetinoScan AI — Local Setup & Installation Specification

This guide provides exhaustive setup and dependency installation instructions for running RetinoScan AI on a local Windows laptop.

---

## 1. System Prerequisites

Before configuring RetinoScan AI, verify that the following core runtimes are installed:

| Component | Verified Version | Recommended Version |
| :--- | :--- | :--- |
| **Operating System** | Windows 11 Home 64-bit | Windows 10/11 64-bit or Windows Server |
| **Node.js** | `v25.2.1` | Node.js v18.x or v20.x LTS |
| **npm** | `11.6.2` | npm v9.x+ |
| **MATLAB** | R2026a (Version 26.1) | MATLAB R2024b, R2025a, or R2026a |
| **Database** | MongoDB Community 7.0+ | Local MongoDB or MongoDB Atlas M0+ |
| **GPU & Drivers** | NVIDIA GeForce RTX 4050 | NVIDIA Driver 550+ with CUDA 12 support |

---

## 2. MATLAB Configuration & Toolbox Verification

RetinoScan AI requires specific MathWorks toolboxes for deep learning inference, image morphology, and parallel computing.

### 2.1 Verify Installed Toolboxes
Open a terminal or MATLAB command prompt and execute:
```matlab
ver
```
Confirm the following products are listed:
1. `MATLAB`
2. `Deep Learning Toolbox` (required for ResNet-18 DR classification and U-Net lesion segmentation)
3. `Image Processing Toolbox` (required for morphological filtering, optic disc detection, and image IO)
4. `Parallel Computing Toolbox` (required for GPU acceleration)

### 2.2 Verify GPU Support
Test GPU visibility in MATLAB:
```matlab
g = gpuDevice();
disp(g.Name);
```
Ensure your NVIDIA GPU is returned (e.g. `NVIDIA GeForce RTX 4050 Laptop GPU`). If no GPU is available, the pipeline will fall back to CPU execution automatically.

---

## 3. Project Dependencies Installation

### 3.1 Backend Dependencies
Navigate to the `backend/` directory and install dependencies:
```bash
cd d:\SIH_Dataset\backend
npm install
```
Key packages installed:
- `express` — Core HTTP REST routing
- `cors` — Cross-Origin Resource Sharing
- `helmet` — Security headers
- `mongoose` — MongoDB object modeling
- `multer` — File upload middleware
- `dotenv` — Environment variable loader
- `uuid` — Unique screening ID generation

### 3.2 Frontend Dependencies
Navigate to the `frontend/` directory and install dependencies:
```bash
cd d:\SIH_Dataset\frontend
npm install
```
Key packages installed:
- `react`, `react-dom` — React 19 UI framework
- `vite` — Frontend build tool and development server
- `framer-motion` — Micro-animations and transitions
- `recharts` — Clinical analytics and calibration distribution charts
- `lucide-react` — Clinical iconography

---

## 4. Environment Variables Configuration

Copy the example configuration files to active `.env` files:

### 4.1 Backend `.env`
```bash
copy backend\.env.example backend\.env
```
Ensure `backend\.env` contains:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/diabetic_retinopathy
MATLAB_CMD=matlab
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```
*Note: If using MongoDB Atlas, replace `MONGODB_URI` with your Atlas cluster connection string.*

### 4.2 Frontend `.env`
```bash
copy frontend\.env.example frontend\.env
```
Ensure `frontend\.env` contains:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 5. Storage Directory Verification

The local screening pipeline requires four upload subdirectories. These are created automatically on startup, but can be verified manually:
```bash
mkdir backend\uploads\original
mkdir backend\uploads\gradcam
mkdir backend\uploads\results
mkdir backend\uploads\results\lesion_masks
```

---

## 6. Verification & Health Check

1. Start MongoDB (locally or confirm Atlas connection).
2. Start the backend: `cd backend && npm start`
3. Verify health in a separate terminal:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response:
   ```json
   {
     "status": "OK",
     "service": "DR Screening API Bridge",
     "database": { "status": "CONNECTED" },
     "matlabModel": { "status": "READY" }
   }
   ```
4. Start the frontend: `cd frontend && npm run dev`
5. Navigate to `http://localhost:5173` in your browser.
