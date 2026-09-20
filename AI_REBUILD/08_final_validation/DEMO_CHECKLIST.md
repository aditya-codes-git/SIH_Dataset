# RetinoScan AI — Final Demonstration Checklist & Protocol
**Event / Presentation:** Smart India Hackathon (SIH) Final Demonstration  
**Target Environment:** Local Workstation (Windows 11, Node.js v20+, MongoDB, MATLAB R2024b / Runtime)

---

## 1. Pre-Demo System Verification (Run Once Before Presentation)

- [ ] **MongoDB Service Running:**
  ```powershell
  Get-Service -Name MongoDB | Select-Object Status, Name
  ```
  *(Or ensure local MongoDB URI in `backend/.env` is accessible: `mongodb://localhost:27017/retinoscan`)*

- [ ] **Node.js Environment Ready:**
  Run backend syntax check:
  ```powershell
  node --check backend/src/server.js
  ```

- [ ] **Frontend Built & Servable:**
  ```powershell
  npm --prefix frontend run build
  ```

- [ ] **Demo Assets Available:**
  Verify that all 6 demo images are in `demo_data/`:
  - `demo_grade_0_normal.png`
  - `demo_grade_1_mild.png`
  - `demo_grade_2_moderate.png`
  - `demo_grade_3_severe.png`
  - `demo_grade_4_proliferative.png`
  - `demo_ungradable_poor_illumination.png`

---

## 2. Starting the Demonstration Environment

### Terminal 1: Backend API
```powershell
cd d:\SIH_Dataset\backend
npm start
```
*Expected log:* `Server listening on port 5000` & `Connected to MongoDB database`.

### Terminal 2: Frontend Workstation
```powershell
cd d:\SIH_Dataset\frontend
npm run dev
```
*Access UI at:* `http://localhost:5173` (or as printed in console).

---

## 3. Live Demonstration Script (Step-by-Step)

### Scenario A: Ungradable Quality Rejection (Safety First)
1. **Action:** Log in as **Operator** (`operator@retinoscan.org`).
2. **Action:** Upload `demo_data/demo_ungradable_poor_illumination.png`.
3. **Observation for Evaluators:**
   - Image Quality Assessment (IQA) rejects the image immediately.
   - Status badge displays: **RECAPTURE REQUIRED**.
   - Clear clinical rationale: *"Poor focus / blurry image; Poor illumination; Insufficient retinal field of view"*.
   - **Key Clinical Point:** Point out that RetinoScan AI refuses to run disease classification or fabricate lesion findings on ungradable images, preventing erroneous diagnoses.

---

### Scenario B: Routine Screening — Non-Referable (Grade 0 / Grade 1)
1. **Action:** Upload `demo_data/demo_grade_0_normal.png`.
2. **Observation for Evaluators:**
   - Status: **GRADABLE**, Quality: **PASS**.
   - Output: **Grade 0 (No DR)**.
   - Calibrated Confidence: **>90%**, Referable Risk: **<1%**.
   - Referral Status: **Non-Referable**.
   - Follow-up Recommendation: *"Routine annual diabetic eye exam"*.
   - **Queue Isolation:** Demonstrate that this case does NOT clutter the Doctor's pending review queue.

---

### Scenario C: Clinical Workstation — Referable DR (Grade 2 Moderate NPDR)
1. **Action:** Upload `demo_data/demo_grade_2_moderate.png`.
2. **Observation:**
   - Status: **GRADABLE**, Output: **Grade 2 (Moderate NPDR)**.
   - Calibrated Probability: **~84%**, Referable Risk: **92.0%**.
   - Referral Status: **Referable DR**.
3. **Explainability & Anatomical Inspection:**
   - Switch to **Grad-CAM Attention Map**: Show high-activation focal zones (not whole-image blue fog).
   - Point out **Numbered Attention Hotspots** overlaid on the fundus.
   - Click on **Retinal Anatomical Landmarks**: Show detected Retinal Field boundary, localized Optic Disc, estimated Macula, and extracted Vessel Tree.
4. **Model-Predicted Lesion Evidence:**
   - Toggle **Lesion Segmentation Overlay**: Show distinct color-coded overlays for **Microaneurysms (Red)**, **Haemorrhages (Magenta)**, and **Hard Exudates (Yellow)**.
   - Display **Lesion Summary Table**: Show extracted component counts, pixel surface areas, and bounding boxes.
   - Highlight the **Mandatory Disclaimer**: *"Model-predicted lesion evidence only. Not a clinical diagnosis."*

---

### Scenario D: Doctor Review & Triage Workflow
1. **Action:** Switch user / Log in as **Ophthalmologist** (`doctor@retinoscan.org`).
2. **Action:** Navigate to **Doctor Pending Reviews Queue**.
   - Note that only Grade 2, 3, and 4 cases appear here.
3. **Action:** Open the Grade 2 screening.
4. **Action:** Enter Clinician Assessment:
   - Clinician Grade: `Grade 2 - Moderate NPDR` (or override if desired).
   - Clinician Notes: *"Corresponds with clinical presentation; confirmed bilateral microaneurysms temporal to fovea."*
   - Triage Action: `Schedule 4-month follow-up`.
5. **Action:** Submit Review.
6. **Observation for Evaluators:**
   - Status updates atomically to **REVIEWED**.
   - Case drops from pending queue.
   - Review audit trail records doctor ID, timestamp, and notes.
   - The AI's original predictions remain **completely immutable**.

---

### Scenario E: Comprehensive Diagnostic Report Generation
1. **Action:** Click **"Download Clinical Report"** / **"Print Summary"**.
2. **Observation for Evaluators:**
   - Shows patient ID, screening timestamp, and camera metadata.
   - Displays IQA metrics (sharpness, illumination, FOV).
   - Lists DR Grade, Calibrated Confidence, and Referable-Risk score.
   - Embeds side-by-side composite visuals:
     - Original Fundus
     - Grad-CAM Attention Map
     - Anatomical Landmarks & Vessel Mask
     - Multi-Class Lesion Segmentation Mask
   - Features Clinician Sign-Off signature block.
   - Prominently displays the AI safety and regulatory disclaimer.

---

## 4. Key Talking Points for Judges

1. **Safety & Calibration First:** "Standard deep networks are overconfident. We calibrated our ResNet-18 using empirical temperature scaling ($T = 1.8063$), aligning predicted probabilities with true empirical risk."
2. **Authentic Multi-Class Lesion Segmentation:** "Unlike systems that merely highlight Grad-CAM heatmaps, RetinoScan AI features a dedicated U-Net trained on the gold-standard IDRiD pixel-level segmentation dataset, accurately segmenting microaneurysms, haemorrhages, and exudates."
3. **Anatomical Context:** "We perform classical morphological analysis to identify the optic disc, macula, and vessel tree, ensuring lesion findings are interpreted within true retinal geography."
4. **Role-Based Clinical Workflow:** "Our system enforces strict clinical governance: operators handle acquisition and triage, while ophthalmologists review high-risk referable cases on an interactive workstation with full audit trails."
