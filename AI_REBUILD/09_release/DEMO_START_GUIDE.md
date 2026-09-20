# RetinoScan AI — SIH Demonstration Quick Start Guide

Follow these 6 simple steps to run the live demonstration on your local Windows machine.

---

## Quick Start (6 Steps)

### Step 1: Ensure MongoDB is Running
- **Local MongoDB**: Ensure the MongoDB service is active on `mongodb://127.0.0.1:27017` (e.g. via Windows Services or `mongod`).
- **MongoDB Atlas**: If using Atlas, confirm your Atlas connection URI is set in `backend/.env`.

### Step 2: Double-Click `start-retinoscan.bat`
- Navigate to the project root directory: `d:\SIH_Dataset\`
- Double-click **`start-retinoscan.bat`** (or execute `.\start-retinoscan.bat` from PowerShell/Terminal).
- The script automatically verifies Node, npm, MATLAB, initializes `uploads/` directories, and starts the backend and frontend in separate command windows.

### Step 3: Open Frontend URL
- Your default web browser will automatically open:
  **[http://localhost:5173](http://localhost:5173)**
- Backend Health Check is available at:
  **[http://localhost:5000/api/health](http://localhost:5000/api/health)**

### Step 4: Login as Operator or Doctor
- In the top-right header, select your demo role:
  - **Operator (Technician)**: Role for patient registration, fundus image upload, image quality checks, and preliminary triage routing.
  - **Doctor (Ophthalmologist)**: Role for clinical queue review, high-resolution Grad-CAM inspection, lesion segmentation analysis, and submitting specialist assessments.

### Step 5: Upload a Retinal Fundus Image
- Use pre-validated sample images from the `demo_data/` folder:
  - `demo_data/demo_grade_0_normal.png` — Normal retina (Non-referable, Grade 0).
  - `demo_data/demo_grade_2_moderate.png` — Moderate NPDR (Referable, Grade 2 with microaneurysms & hemorrhages).
  - `demo_data/demo_grade_4_proliferative.png` — Proliferative DR (Urgent, Grade 4 with neovascularization).
  - `demo_data/demo_ungradable_poor_illumination.png` — Low-quality test image demonstrating the Image Quality Assessment (IQA) hard gate and recapture workflow.

### Step 6: Run Screening & Review Results
- Click **"Analyze Retinal Scan"**.
- View:
  - Authoritative AI DR Grade (0 to 4) & Confidence Score.
  - Calibrated probability distribution & temperature scaling.
  - Saliency Grad-CAM neural attention heatmap.
  - Retinal anatomical landmarks (optic disc, macula, vessel density).
  - Deep learning U-Net lesion evidence (MA, HE, EX, SE).
  - Clinical Triage Priority (ROUTINE, MEDIUM, HIGH, URGENT).
- As a Doctor, click **"Submit Review"** to record an immutable specialist assessment.

---

## Clean Shutdown

When finished with the demonstration:
- Double-click **`stop-retinoscan.bat`** in the project root.
- This cleanly terminates all active server processes on ports 5000 and 5173.
