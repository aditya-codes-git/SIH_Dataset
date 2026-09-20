# RetinoScan AI — Local Deployment Architecture Specification

## 1. Local Runtime Topology

RetinoScan AI runs as an integrated multi-process application entirely on a local Windows laptop. The architecture is engineered for clinical edge computing in rural screening camps or hospital ophthalmology departments.

```
+---------------------------------------------------------------------------------+
|                         LOCAL WINDOWS HOST ENVIRONMENT                          |
|                                                                                 |
|   +-------------------------------------------------------------------------+   |
|   |                          REACT 19 / VITE FRONTEND                       |   |
|   |                    http://localhost:5173 (PID: Frontend)                |   |
|   |  - Operator Screening Workflow        - High-Res Grad-CAM Saliency      |   |
|   |  - Doctor Triage & Review Queue       - U-Net Lesion Evidence Viewer    |   |
|   +-------------------------------------------------------------------------+   |
|                                        |                                        |
|                          HTTP Requests | /api/* (VITE_API_BASE_URL)             |
|                                        v                                        |
|   +-------------------------------------------------------------------------+   |
|   |                         NODE.JS / EXPRESS API BRIDGE                    |   |
|   |                     http://localhost:5000 (PID: Backend)                |   |
|   |  - Role-Based Access Guard            - Multer Image Ingestion          |   |
|   |  - SIH26038 Triage Routing Engine     - Static Asset Streaming Server   |   |
|   |  - AI Assistant Explanatory Service   - MongoDB Persistence Manager     |   |
|   +-------------------------------------------------------------------------+   |
|                     |                                         |                 |
|      Mongoose ODM   | TCP :27017            child_process     | CLI Batch Exec  |
|      Connection     |                       .exec()           |                 |
|                     v                                         v                 |
|   +--------------------------+      +---------------------------------------+   |
|   |   MONGODB PERSISTENCE    |      |         MATLAB R2026a ENGINE          |   |
|   |  Local MongoDB / Atlas   |      |  Entry: runScreeningFromFile.m        |   |
|   |  - Screenings collection |      |  - ResNet-18 DR Classifier (5-class)  |   |
|   |  - Immutable audit logs  |      |  - Multi-Scale Grad-CAM Attention     |   |
|   |  - Clinical reviews      |      |  - Temperature Probability Scaling    |   |
|   +--------------------------+      |  - Retinal Landmark Morphology        |   |
|                                     |  - Lesion U-Net Tiled Segmentation    |   |
|                                     |    (Evaluated on NVIDIA RTX 4050 GPU) |   |
|                                     +---------------------------------------+   |
|                                                           |                     |
|                               Writes Images & JSON        v                     |
|   +-------------------------------------------------------------------------+   |
|   |                  LOCAL PERSISTENT FILESYSTEM STORAGE                    |   |
|   |                  d:\SIH_Dataset\backend\uploads\                        |   |
|   |  - /original/   : Uploaded patient retinal fundus images                |   |
|   |  - /gradcam/    : Generated high-resolution Grad-CAM overlays           |   |
|   |  - /results/    : Retinal landmark maps & composite visual overlays     |   |
|   |  - /results/lesion_masks/ : Discrete pixel masks (MA, HE, EX, SE)       |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------+
```

---

## 2. Port Allocations & Networking

| Port | Protocol | Service | Binding | Description |
| :--- | :--- | :--- | :--- | :--- |
| **5173** | HTTP | React / Vite Frontend | `127.0.0.1` / `localhost` | Client application serving Operator and Doctor portals. |
| **5000** | HTTP | Express API Bridge | `0.0.0.0` / `localhost` | Core REST API accepting uploads, triggering MATLAB, and serving clinical data. |
| **27017** | TCP | MongoDB Server | `127.0.0.1` (or Atlas cloud) | Document persistence store for screening records and reviews. |

---

## 3. Process Supervision & Automation

Local deployment is managed using two root batch scripts:
1. **`start-retinoscan.bat`**:
   - Performs automated pre-flight checks (Node.js, npm, MATLAB, `.env`).
   - Ensures upload directory hierarchy exists.
   - Spawns the backend in a dedicated command window (`RetinoScan-Backend`).
   - Spawns the frontend in a dedicated command window (`RetinoScan-Frontend`).
   - Launches the web browser targeting `http://localhost:5173`.
2. **`stop-retinoscan.bat`**:
   - Uses PowerShell port detection to cleanly kill processes listening on port 5000 and port 5173 without interfering with unrelated system processes.

---

## 4. Hardware Compute Utilization (GPU Acceleration)

- **Deep Learning Model Execution**:
  - ResNet-18 classification and Grad-CAM: Executed via MATLAB Deep Learning Toolbox.
  - 4-class Lesion U-Net: Executed via `predictLesions.m` using 256x256 tiles with stride 192 and Bartlett window blending.
- **GPU Device**: NVIDIA GeForce RTX 4050 Laptop GPU (6 GB VRAM).
- **Execution Performance**:
  - GPU Inference Time: **~2.1 – 3.2 seconds** per complete image.
  - CPU Fallback Time: **~22 – 38 seconds** per complete image.
- **Memory Safety**: Tiled processing caps GPU memory consumption at < 500 MB VRAM, preventing out-of-memory errors on laptop GPUs.
