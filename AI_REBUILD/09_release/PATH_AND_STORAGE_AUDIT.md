# RetinoScan AI — Path, Storage & Security Audit

---

## 1. Path Audit & Classification

A rigorous search was conducted across all files (`.js`, `.jsx`, `.m`, `.json`, `.env`) in the workspace for absolute paths, machine-local drive letters, and loopback networking addresses.

### 1.1 Detailed Path Inventory & Classification

| File Location | Pattern / Value Detected | Classification | Remediation Required |
| :--- | :--- | :--- | :--- |
| `frontend/src/services/api.js` (Line 124) | `http://127.0.0.1:5000${cleanPath}` | **Must become relative path or env var** | **CRITICAL BUG**: Hardcodes localhost in asset URLs (`getFileUrl`). Breaks all image viewing on remote deployments. Replace with relative URL or `BASE_URL` origin. |
| `frontend/src/services/api.js` (Line 1) | `import.meta.env.VITE_API_BASE_URL \|\| 'http://127.0.0.1:5000/api'` | **Must become environment variable** | Fallback is acceptable for local dev; production must supply `VITE_API_BASE_URL`. |
| `frontend/.env` (Line 1) | `VITE_API_BASE_URL=http://127.0.0.1:5000/api` | **Must become environment variable** | Set to production backend domain on deployment (e.g. Vercel dashboard). |
| `frontend/vite.config.js` (Line 11) | `target: 'http://127.0.0.1:5000'` | **Development-only** | Vite dev server reverse proxy for local testing. No production impact. |
| `backend/.env` (Line 2) | `MONGODB_URI=mongodb://127.0.0.1:27017/diabetic_retinopathy` | **Must become environment variable** | Must point to MongoDB Atlas cluster string in staging/production. |
| `backend/src/config/db.js` (Line 7) | `mongodb://127.0.0.1:27017/diabetic_retinopathy` | **Must become environment variable** | Local dev fallback. Handled via `process.env.MONGODB_URI`. |
| `backend/src/server.js` (Lines 21-22) | `http://localhost:${PORT}/api/health` | **Development-only** | Informational console log output at server startup. |
| `backend/src/services/matlab/matlabRunner.js` (Line 21) | `path.resolve(__dirname, '../../../../').replace(/\\/g, '/')` | **Must remain machine-local for MATLAB** | Dynamically resolves workspace root path (`D:/SIH_Dataset`) to pass into MATLAB `addpath()`. |
| `backend/src/services/matlab/matlabService.js` (Line 14) | `path.resolve(__dirname, '../../../uploads')` | **Must remain machine-local for MATLAB** | Resolves disk path for output files passed to MATLAB CLI. |
| `backend/src/middleware/uploadMiddleware.js` (Line 6, 14, 19) | `path.resolve(__dirname, '../../uploads/...')` | **Must remain machine-local for MATLAB** | Resolves Multer destination folders. |
| `runScreeningFromFile.m` (Lines 34, 72) | `fullfile(fileparts(mfilename('fullpath')), 'AI_REBUILD')` | **Must remain machine-local for MATLAB** | Clean relative path computation from executing `.m` file. Fully portable across drives/directories on the same machine. |
| `AI_REBUILD/07_retinal_analysis/validation_gallery/*/retinal_analysis.json` | `"maskPath": "D:\\SIH_Dataset\\..."`<br>`"originalFundus": "D:\\SIH_Dataset\\..."` | **Development-only test artifacts** | Historical test validation records created during Phase 5/6 development. Not generated live during web requests. |

---

## 2. Filesystem & Storage Audit

### 2.1 Storage Classification Table

| Category | Storage Path / Target | Ingestion / Generation Mechanism | Lifetime & Persistence Requirement | Ephemeral Container Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Uploaded Fundus Images** | `backend/uploads/original/${screeningId}.${ext}` | Multer disk storage (`uploadMiddleware.js`) | **Permanent / Long-Term**. Required for patient screening history, clinician verification, and auditing. | **HIGH**: Lost on container reboot unless mounted to persistent volume or cloud object store (S3). |
| **Grad-CAM Visual Overlays** | `backend/uploads/gradcam/${screeningId}_gradcam.png` | MATLAB `generateImprovedGradCAM.m` | **Permanent / Long-Term**. Core clinical explainability artifact reviewed by ophthalmologists. | **HIGH**: Lost on container reboot. |
| **Lesion Segmentation Masks** | `backend/uploads/results/lesion_masks/${screeningId}_*.png` | MATLAB `extractLesionEvidence.m` | **Permanent / Long-Term**. Pixel-level diagnostic ground truth for microaneurysms, hemorrhages, and exudates. | **HIGH**: Lost on container reboot. |
| **Composite Retinal Landmarks** | `backend/uploads/results/${screeningId}_*.png` | MATLAB `renderRetinalAnalysis.m` | **Permanent / Long-Term**. Optic disc, macula, and vessel overlays. | **HIGH**: Lost on container reboot. |
| **Intermediate Screening Results** | `backend/uploads/results/${screeningId}_result.json` | MATLAB `runScreeningFromFile.m` | **Temporary / Ephemeral**. Can be purged after Node reads and persists to MongoDB. | **LOW**: Data safely ingested into MongoDB. |
| **Temporary MATLAB Process Files** | System `%TEMP%` / MATLAB cache | MATLAB R2026a process memory | **Transient**. Purged automatically upon process exit. | None. |
| **Clinical Reports** | Client-side dynamic DOM | React `ReportViewer.jsx` via browser `window.print()` | **Virtual**. No server files created. Structured data resides in MongoDB document. | None. |

### 2.2 Storage Scalability Assessment
- Average disk footprint per completed screening:
  - Original Image: ~2–8 MB
  - Grad-CAM Overlay: ~350–800 KB
  - Lesion Masks & Composites: ~1.5–3.5 MB
  - Total per patient screening: **~4–12 MB**
- **1,000 Screenings**: ~4–12 GB disk space.
- **Recommendation**: In production, decouple file storage from local filesystem by routing Multer uploads directly to an S3-compatible bucket (e.g. AWS S3, Cloudflare R2, MinIO).

---

## 3. Security & Vulnerability Audit

### 3.1 Secrets, Environment & API Keys
- **Secrets in Code**: **CLEAN**. No hardcoded AWS credentials, private encryption keys, or passwords were found in Git-tracked files.
- **Git Tracking**:
  - `backend/.env` and `frontend/.env` are correctly ignored by root `.gitignore` (lines 69–71, 89–91).
  - Both files exist on the local workspace for immediate development.
  - **Gap**: Neither `backend/.env.example` nor `frontend/.env.example` existed in the repository. Standard deployment pipelines require template `.env.example` files to document needed keys.

### 3.2 Authentication & Authorization (Auth Guard)
- **Current State**: Prototype-level Header Authentication.
  - `authMiddleware.js` inspects `req.headers['x-demo-role']` or query parameter `?role=...`.
  - Roles supported: `operator` and `doctor`.
  - If header is absent, responds with `401 Unauthorized`.
  - If non-doctor accesses `/api/agent/*` or doctor-only endpoints, responds with `403 Forbidden`.
- **Production Vulnerability**:
  - **Unauthenticated Impersonation**: Any client can forge `x-demo-role: doctor` without credentials or signature.
  - **Remediation**: Implement industry-standard JSON Web Tokens (JWT) signed with `JWT_SECRET` or session cookies, backed by a hashed user table (bcrypt) with login endpoints (`/api/auth/login`).

### 3.3 Path Traversal Vulnerability in File Streaming
- **Audit Finding**:
  - In `backend/src/routes/fileRoutes.js`:
    ```javascript
    // Line 12: /api/files/original/:filename
    const filePath = path.join(originalDir, req.params.filename);
    res.sendFile(filePath);

    // Line 23: /api/files/gradcam/:filename
    let filePath = path.join(gradcamDir, filename);
    res.sendFile(filePath);
    ```
    `req.params.filename` is passed directly into `path.join()` without sanitization. An attacker supplying `../../../../etc/passwd` or `../../windows/win.ini` could attempt directory traversal.
  - In contrast, Line 46 correctly uses `path.basename(req.params.filename)`.
- **Severity**: **MEDIUM / HIGH**.
- **Remediation**: Wrap all route parameters in `path.basename()` before joining paths:
  ```javascript
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(originalDir, safeFilename);
  ```

### 3.4 Uploaded Filename Handling & File Type Validation
- **Current State**: **ROBUST**.
  - In `uploadMiddleware.js`, Multer assigns filenames using `uuidv4()`:
    ```javascript
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${screeningId}${ext}`);
    ```
    This prevents arbitrary code execution or filesystem overwrites from malicious uploaded filenames.
  - File extension and MIME type are strictly validated against: `['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp']`.
  - Max upload size is capped at 50 MB.

### 3.5 Cross-Origin Resource Sharing (CORS) & Security Headers
- **Current State**:
  - In `backend/src/app.js`: `app.use(cors());` enables wildcard `Access-Control-Allow-Origin: *`.
  - `helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })` is active, allowing cross-origin image streaming.
- **Production Vulnerability**:
  - Wildcard CORS allows any website to make cross-origin API calls on behalf of users.
- **Remediation**: Configure CORS to restrict allowed origins to the configured frontend domain:
  ```javascript
  const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173'];
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  ```
