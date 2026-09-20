# RetinoScan AI — Local Troubleshooting & Diagnostics Guide

This document lists known operational issues, failure symptoms, and step-by-step diagnostic and remediation workflows.

---

## Diagnostic Matrix

| Issue Category | Symptom | Likely Cause | Resolution |
| :--- | :--- | :--- | :--- |
| **Port Conflict** | Backend fails to start with `EADDRINUSE: port 5000` | A previous Node process or daemon is still bound to port 5000 | Run `stop-retinoscan.bat` to clear the port, or run `Get-NetTCPConnection -LocalPort 5000` in PowerShell and kill the PID. |
| **MATLAB Missing** | Screening request fails with `matlab: command not found` | MATLAB installation bin folder is not included in Windows system PATH | Add `C:\Program Files\MATLAB\R2026a\bin` to system PATH, or specify the full path in `backend/.env` under `MATLAB_CMD`. |
| **Database Disconnected** | Health check reports `database: "UNAVAILABLE"` | Local MongoDB service is stopped, or Atlas connection timed out | Start MongoDB via Windows Services (`net start MongoDB`) or verify internet access and IP whitelist if using MongoDB Atlas. |
| **IQA Rejection** | Screening returns `status: "UNGRADABLE"` | Input fundus image has poor illumination, blur, or insufficient FOV | Expected clinical behavior. Recapture image or use standard demo image `demo_data/demo_grade_0_normal.png`. |
| **GPU Fallback** | Screening takes > 25 seconds | MATLAB GPU device is uninitialized or NVIDIA drivers are outdated | Run `gpuDevice()` in MATLAB to check status. Update NVIDIA Game Ready / Studio drivers to ensure CUDA compatibility. |
| **CORS Blocked** | Browser console shows CORS origin error | Frontend accessed via unwhitelisted IP or port | Add origin (e.g. `http://localhost:5174`) to `CORS_ORIGINS` in `backend/.env` and restart backend. |

---

## Detailed Remediation Procedures

### 1. Clearing Orphan Server Processes
If either port 5000 or 5173 remains occupied after an abnormal terminal close:
```powershell
powershell -Command "Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
```

### 2. Testing MATLAB CLI Manually
To verify that MATLAB responds to external batch invocations:
```bash
matlab -batch "disp('MATLAB CLI is operational'); exit;"
```
If this command hangs or fails, check your MathWorks license activation in the MATLAB desktop application.

### 3. Verifying MongoDB Atlas Connection
If connecting to MongoDB Atlas:
1. Ensure your current laptop IP address is added to the **Network Access IP Access List** in the MongoDB Atlas Cloud Console.
2. Confirm the connection string format in `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/diabetic_retinopathy?retryWrites=true&w=majority
   ```
3. Test connectivity:
   ```bash
   node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK')).catch(console.error)"
   ```

### 4. Upload Directory Permissions
If uploads fail with `EPERM` or `ENOENT`:
Ensure that the Windows user account has write permissions to `d:\SIH_Dataset\backend\uploads\`.
Run:
```bash
mkdir backend\uploads\original backend\uploads\gradcam backend\uploads\results backend\uploads\results\lesion_masks
```
