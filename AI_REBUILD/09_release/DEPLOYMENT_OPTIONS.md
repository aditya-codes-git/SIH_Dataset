# RetinoScan AI — Deployment Options Evaluation

This document evaluates three architectural deployment strategies for the current RetinoScan AI system based on verified runtime dependencies, licensing constraints, and hardware characteristics.

---

## Comparative Matrix

| Evaluation Dimension | Option A: Controlled Windows Machine | Option B: Docker / Linux via Compiled MCR | Option C: Decoupled Cloud API + Worker |
| :--- | :--- | :--- | :--- |
| **Feasibility** | **HIGH (Immediate)** | **LOW / REQUIRES WORK** | **HIGH (Recommended for Cloud)** |
| **Licensing Needed** | Desktop MATLAB + Deep Learning + Image Processing Toolbox | MATLAB Compiler (for build) + Free MCR (Runtime) | Desktop MATLAB on inference node only; Standard Cloud for Web |
| **Current Code Reuse** | **100% (Drop-in)** | **60% (Requires compilation & runner rewrite)** | **85% (Requires queue/worker separation)** |
| **Hardware Target** | On-premise Windows workstation / Hospital server | Linux container host (AWS ECS, GCP Cloud Run, Docker) | Vercel (Front) + Render (API) + Local/Cloud GPU Worker |
| **Deployment Complexity**| Low | Very High | Moderate |
| **Inference Cold Start** | 10–18 seconds (matlab -batch CLI) | 2–5 seconds (standalone binary) | 10–18 s (or 0 s if persistent runner daemon) |
| **Scalability** | Single-node vertical scaling | Horizontal container scaling | Independent scaling of web vs compute |

---

## Option A: Controlled Windows Inference Machine (Monolithic Host)

### 1. Architectural Concept
Run the entire stack (Node.js API, MATLAB R2026a, MongoDB, and Frontend preview/server) on a single controlled Windows machine (e.g., hospital diagnostic workstation, clinic server, or cloud Windows Server with GPU).

```
+-------------------------------------------------------------------------------+
|                       CONTROLLED WINDOWS INFERENCE HOST                       |
|                                                                               |
|  +---------------------+      +---------------------+      +---------------+  |
|  | Frontend (Vite/SPA) | ---> | Node.js Express API | ---> | MongoDB Local |  |
|  | (Port 5173 / Nginx) |      | (Port 5000 / PM2)   |      | (Port 27017)  |  |
|  +---------------------+      +---------------------+      +---------------+  |
|                                          |                                    |
|                                          v child_process.exec()               |
|                               +---------------------+                         |
|                               | Desktop MATLAB CLI  |                         |
|                               | (runScreeningFromFile)|                       |
|                               +---------------------+                         |
+-------------------------------------------------------------------------------+
```

### 2. Feasibility
- **Rating**: **HIGH (100% Feasible Immediately)**
- This is the exact configuration currently functioning in development. No recompilation or framework migration is necessary.

### 3. Required Software & Licensing
- **Operating System**: Windows 10/11 Pro or Windows Server 2019/2022 (64-bit).
- **MATLAB**: Installed MATLAB R2026a (or R2024b/R2025a) with an active named-user or network concurrent license.
- **Required Toolboxes**: Deep Learning Toolbox, Image Processing Toolbox, Parallel Computing Toolbox (for GPU).
- **Runtimes**: Node.js 18+ LTS, MongoDB 6.0+ Community Server or connection string to MongoDB Atlas.
- **Process Manager**: PM2 for Windows (`pm2 start src/server.js`) or NSSM (Non-Sucking Service Manager) to run Node as a Windows Service.

### 4. Required Code Changes
- **Backend**:
  - Replace hardcoded fallback IP `127.0.0.1` with environment variable `MONGODB_URI`.
  - Fix path traversal gaps in `backend/src/routes/fileRoutes.js`.
  - Configure CORS whitelist for production domain.
- **Frontend**:
  - Fix `frontend/src/services/api.js` line 124 (`getFileUrl`) where `http://127.0.0.1:5000` is hardcoded.
- **Estimated Dev Effort**: 1–2 hours.

### 5. Pros & Cons
- **Pros**:
  - Guaranteed exact mathematical and clinical parity with validation tests.
  - Zero MATLAB Compiler friction; uses full MATLAB debugging and tooling.
  - Retains direct local access to NVIDIA GPU acceleration.
- **Cons**:
  - Expensive desktop MATLAB licensing per physical machine.
  - Each screening incurs 10–18 second MATLAB CLI process spawn latency.
  - Limited to Windows environment.

---

## Option B: Docker / Linux Inference Service via Compiled MATLAB Runtime (MCR)

### 1. Architectural Concept
Compile the MATLAB inference pipeline into a standalone Linux binary using the MATLAB Compiler (`mcc`), package the binary into a Docker container alongside the MathWorks MATLAB Runtime (MCR), and deploy as a stateless Linux microservice.

```
+-------------------------------------------------------------------------------+
|                            LINUX DOCKER CONTAINER                             |
|                                                                               |
|  +---------------------+      +--------------------------------------------+  |
|  | Node.js Express API | ---> | Compiled Standalone C/C++ Binary           |  |
|  | (API Bridge)        |      | (runScreeningStandalone generated by mcc)  |  |
|  +---------------------+      +--------------------------------------------+  |
|                                                     |                         |
|                                                     v Shared Libraries        |
|                               +--------------------------------------------+  |
|                               | MATLAB Runtime (MCR v9.x / R2026a)         |  |
|                               | (Headless, royalty-free Linux distribution)|  |
|                               +--------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

### 2. Feasibility
- **Rating**: **LOW / REQUIRES WORK (Currently Blocked)**
- **Blocking Factor**: Host audit confirms `exist('mcc', 'file') == 0`. The MATLAB Compiler product is **not installed** on this system, and `Compiler_SDK` license is `0`.
- Building a standalone Linux binary requires a Linux build machine (or Windows machine cross-compiling) with a fully licensed and installed MATLAB Compiler.

### 3. Required Software & Licensing
- **Build Phase**: Licensed MATLAB installation + MATLAB Compiler toolbox on the build host.
- **Runtime Phase**: Free MathWorks MATLAB Runtime (MCR) installer for Linux (royalty-free redistribution license).
- **Container Host**: Docker engine, NVIDIA Container Toolkit (if GPU acceleration is required in container).

### 4. Required Code Changes
- Compile `runScreeningFromFile.m` into a standalone binary:
  ```bash
  mcc -m runScreeningFromFile.m -a AI_REBUILD/ -a trained_dr_model_preprocessed.mat
  ```
- Rewrite `backend/src/services/matlab/matlabRunner.js` to execute `./runScreeningStandalone inputPath outputPath gradcamPath` instead of invoking `matlab -batch "addpath(...)"`.
- Write multi-stage `Dockerfile`:
  - Stage 1: Download & extract ~3 GB MATLAB Runtime installer.
  - Stage 2: Install Node.js, dependencies, and copy compiled binary.
  - Set `LD_LIBRARY_PATH` to point to MCR shared library paths (`v9xx/runtime/glnxa64`, `v9xx/bin/glnxa64`, `v9xx/sys/os/glnxa64`).
- **Estimated Dev Effort**: 2–3 days (once MATLAB Compiler is obtained).

### 5. Pros & Cons
- **Pros**:
  - No desktop MATLAB license required at runtime in production.
  - Faster execution: eliminates full MATLAB GUI/desktop startup overhead (cold start drops to 2–4s).
  - Deployable to Kubernetes, AWS ECS, GCP Cloud Run, or Render (with Docker disk).
- **Cons**:
  - Huge Docker container image size (4–7 GB), leading to slow deployment and image pulling.
  - Deep Learning model compilation often runs into MCR dynamic library path issues.
  - GPU acceleration inside Docker requires specialized NVIDIA Container Toolkit setup.

---

## Option C: Practical Decoupled Architecture (Cloud Web + Dedicated Inference Node)

### 1. Architectural Concept
Decouple the web-facing application from the heavy MATLAB compute engine:
1. **Frontend**: Deployed to **Vercel** (Global CDN, fast page loads, automatic SSL).
2. **Database**: Hosted on **MongoDB Atlas** (Managed cloud database).
3. **Backend API Gateway**: Deployed to **Render** or **Railway** (Handles authentication, patient records, triage, review queues, and AI assistant chat).
4. **Compute Engine / Inference Worker**: Hosted on the **Controlled Windows Machine** (with existing MATLAB installation).
5. **Storage**: **AWS S3** or **Cloudinary** for medical image hosting (accessible by both cloud API and inference worker).

```
+-------------------------------------------------------------------------------+
|                                  CLOUD TIER                                   |
|                                                                               |
|  +--------------------+        +---------------------+        +------------+  |
|  |  Vercel Frontend   | -----> |  Render Backend API | -----> |  MongoDB   |  |
|  |  (Next/React SPA)  |        |  (Node / Express)   |        |   Atlas    |  |
|  +--------------------+        +---------------------+        +------------+  |
|           |                               |                         |         |
|           \--------------+----------------/                         |         |
|                          v                                          |         |
|                  +---------------+                                  |         |
|                  | AWS S3 Bucket | <--------------------------------+         |
|                  | (Image Store) |                                            |
|                  +---------------+                                            |
+--------------------------|----------------------------------------------------+
                           | Secure Poll / Webhook / Redis Queue
                           v
+-------------------------------------------------------------------------------+
|                       DEDICATED INFERENCE WORKER NODE                         |
|                       (On-Premise / Hospital / Clinic)                        |
|                                                                               |
|  +------------------------+      +-----------------------------------------+  |
|  | Worker Service Agent   | ---> | MATLAB R2026a Desktop Engine            |  |
|  | (Node.js daemon / Bull)|      | (runScreeningFromFile.m on RTX 4050 GPU)|  |
|  +------------------------+      +-----------------------------------------+  |
+-------------------------------------------------------------------------------+
```

### 2. Feasibility
- **Rating**: **HIGH (Modern Standard for Medical AI Workflows)**
- Completely solves the problem of MATLAB's inability to run on serverless/ephemeral cloud platforms like Vercel or Render.

### 3. Required Software & Licensing
- **Cloud**: Free/Standard tiers of Vercel, Render, and MongoDB Atlas.
- **Inference Node**: Existing licensed MATLAB on the Windows host machine.
- **Object Storage**: AWS S3, Cloudflare R2, or Cloudinary (free tiers available).

### 4. Required Code Changes
- Add asynchronous queue mechanism (BullMQ with Redis, or MongoDB change streams, or simple polling worker).
- Update Multer to upload fundus images to S3/Cloudinary instead of local disk.
- Worker script downloads image from S3, executes MATLAB, uploads Grad-CAM and overlays back to S3, and writes results back to MongoDB Atlas.
- **Estimated Dev Effort**: 1–2 days.

### 5. Pros & Cons
- **Pros**:
  - Doctors and operators can access the web application from anywhere via HTTPS.
  - Zero changes to the verified MATLAB AI model or pipeline.
  - Asynchronous screening prevents HTTP request timeouts on slow connections.
  - Clean separation between healthcare PHI/web traffic and heavy GPU compute.
- **Cons**:
  - Requires cloud object storage integration (S3).
  - Inference worker must maintain an active internet connection to poll jobs from the cloud.
