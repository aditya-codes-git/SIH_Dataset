# RetinoScan AI — Complete Product Workflow & Architecture Documentation (SIH26038)

**Document Version:** 2.0.0  
**Project:** Smart India Hackathon 2026 — Problem Statement ID: SIH26038  
**Title:** Explainable AI for Diabetic Retinopathy Screening in Rural India  
**Target Repository:** `D:\SIH_Dataset`  

---

## 1. Actual Product Workflow

The application is built for rural eye checkup camps and health centers to screen patients for Diabetic Retinopathy (DR) using AI-assisted decision support, while reducing unnecessary specialist workload.

```
PATIENT (Rural Eye Checkup Camp)
   ↓
OPERATOR / HEALTHCARE WORKER
   ↓
FUNDUS CAMERA / IMAGE UPLOAD
   ↓
IMAGE QUALITY ASSESSMENT (Focus, Illumination, FOV)
   ↓
 ┌───────────────────────┐
 │                       │
FAIL                   PASS
 │                       │
 ↓                       ↓
RECAPTURE              DR SCREENING (MATLAB ResNet-18)
 │                       ↓
 └──────────────→     EXPLAINABLE REPORT & GRAD-CAM
                         ↓
                    DR GRADE (0–4) & CONFIDENCE %
                         ↓
                    RISK TRIAGE ENGINE
                         ↓
              ┌──────────┴──────────┐
              │                     │
           GRADE 0–1             GRADE 2+
          (Low Risk)            (Referable)
              │                     │
              ↓                     ↓
      ROUTINE FOLLOW-UP       OPHTHALMOLOGIST PRIORITY QUEUE
                              (Medium / High / Urgent)
                                    ↓
                              FINAL CLINICAL REVIEW
```

**Implementation Status:** `IMPLEMENTED`

---

## 2. Operator Workflow

The Operator works at the rural health camp and conducts the screening process.

### Step-by-Step Operator Flow:
1. **Patient Registration:** Enters Patient ID, Name, Age, Gender, Diabetes Duration, and Health Camp Location.
2. **Fundus Image Capture:** Uploads/selects retinal fundus photograph (supports PNG, JPEG, TIFF, BMP). The original byte stream is preserved without client-side modification or compression.
3. **Image Quality Assessment (HARD GATE):** Runs MATLAB `imageQualityCheck.m`. If quality fails (`status = "UNGRADABLE"`), DR screening is blocked, exact IQA failure reasons are shown, and the Operator is prompted to recapture.
4. **DR Screening Execution:** If quality passes (`status = "GRADABLE"`), executes MATLAB ResNet-18 model.
5. **Triage Routing Outcome:**
   - **Grade 0–1:** Low Risk $\rightarrow$ `Routine Follow-up` (`[ Complete Screening ]`).
   - **Grade 2+:** Referable DR $\rightarrow$ `Ophthalmologist Review` (`[ Send to Ophthalmologist Queue ]`).
6. **Digital Screening Report:** Generates a printable/viewable digital report format (`ReportViewer.jsx`).

**Implementation Status:** `IMPLEMENTED`

---

## 3. Ophthalmologist Workflow

The Ophthalmologist receives referred cases requiring specialist review from rural camps.

### Step-by-Step Ophthalmologist Flow:
1. **Doctor Dashboard Queue:** Centered around **Pending Specialist Reviews**, sorted by:
   - 1. Priority (`URGENT` Grade 4 > `HIGH` Grade 3 > `MEDIUM` Grade 2).
   - 2. Waiting time.
2. **Clinical Review Screen:**
   - **Demographics & Timestamp:** Patient profile, screening location, and date/time.
   - **Two-Panel Image Viewer:** Original Fundus Image (left) vs **Model Attention — Grad-CAM** heatmap (right) with zoom/lightbox.
   - **MATLAB Model Result Card:** Authoritative DR Grade (0-4), Confidence %, Referable Status, Priority.
   - **Image Quality Assessment Card:** Focus Variance, Mean Brightness, Retinal FOV Ratio.
   - **Patient Screening History:** Timeline tracking historical progression over time.
   - **Human Clinical Review Form:** `Confirm` or `Reassess / Override`, Doctor Notes, Final Decision.
   - **AI Screening Assistant:** Contextual Q&A panel explaining MATLAB outputs.

**Implementation Status:** `IMPLEMENTED`

---

## 4. Image Quality Assessment Hard Gate

Image Quality Assessment (IQA) is a non-negotiable hard gate performed by MATLAB `imageQualityCheck.m`.

### IQA Criteria & Thresholds:
1. **Focus Score (Laplacian Variance):** `focusScore >= 0.00008`
2. **Brightness (Mean Intensity):** `0.08 <= brightness <= 0.40`
3. **Field of View Ratio:** `fovRatio >= 0.45`

### Hard Gate Control Logic:
- If `status === "UNGRADABLE"`:
  - `drGrade` remains `null`.
  - `referralRequired` remains `false`.
  - DR classification and Grad-CAM **DO NOT** run.
  - Operator sees reasons (*"Poor focus / blurry image"*, *"Poor illumination"*, *"Insufficient retinal field of view"*).
  - Only `[ Recapture Image ]` action is enabled.
- If `status === "GRADABLE"`:
  - Focus ✓ PASS, Illumination ✓ PASS, FOV ✓ PASS.
  - DR screening proceeds.

**Implementation Status:** `IMPLEMENTED`

---

## 5. MATLAB Model Boundary

MATLAB is the authoritative, read-only black box AI engine.

### Read-Only Black Box Files:
- `trained_dr_model.mat`
- `drScreen.m`
- `imageQualityCheck.m`
- `runScreeningFromFile.m`
- `dr_network.mat`

### Data Integrity Rules:
- Node.js consumes MATLAB outputs directly without modifying predictions or confidence scores.
- ResNet-18 5-class DR grading (0, 1, 2, 3, 4).
- Authoritative MATLAB values (`drGrade`, `confidence`, `referable`, `referral`, `gradcam.png`) are delivered directly to the user interface.

**Implementation Status:** `IMPLEMENTED`

---

## 6. DR Grading & Triage Referral Logic

| MATLAB DR Grade | Risk Triage Classification | Referral Required | Priority Level | Routing Destination |
| :---: | :---: | :---: | :---: | :---: |
| **Grade 0** | Low Risk (No DR) | `false` | `ROUTINE` | Routine Follow-up |
| **Grade 1** | Low Risk (Mild DR) | `false` | `ROUTINE` | Routine Follow-up |
| **Grade 2** | Referable (Moderate DR) | `true` | `MEDIUM` | Ophthalmologist Review |
| **Grade 3** | Referable (Severe DR) | `true` | `HIGH` | Ophthalmologist Review |
| **Grade 4** | Referable (Proliferative DR) | `true` | `URGENT` | Urgent Ophthalmologist Review |

**Implementation Status:** `IMPLEMENTED`

---

## 7. Database Flow & Human Review Separation

The application uses MongoDB database `diabetic_retinopathy` with schema defined in `Screening.js`.

### Data Separation Architecture:
1. **AI RESULT (Immutable):** `drGrade`, `predictedClass`, `confidence`, `referable`, `referral`, `gradcamImagePath`.
2. **RISK TRIAGE:** `referralRequired`, `priority`, `routing`, `status`.
3. **HUMAN CLINICAL REVIEW (Separate):** `doctorDecision`, `doctorNotes`, `reviewer`, `reviewedAt`.

> [!IMPORTANT]
> When a Doctor submits a review or reassesses a case, the original MATLAB prediction (`drGrade`, `confidence`, `referable`) is **NEVER overwritten**. Both AI prediction and Doctor review are persisted separately for auditability.

**Implementation Status:** `IMPLEMENTED`

---

## 8. AI Screening Assistant Boundary

- **Implementation:** Local deterministic rule engine (`aiAgentService.js`).
- **Capabilities:** Explains screening results, referral reasons, image quality metrics, and Grad-CAM meanings.
- **Safety Boundaries:**
  - Cannot change `drGrade`, `confidence`, or `referable` status.
  - Cannot override MATLAB predictions.
  - Cannot independently diagnose patients.
  - Clearly separated in UI under **AI ASSISTANT EXPLANATION**.

**Implementation Status:** `IMPLEMENTED` (Deterministic Heuristic Assistant)

---

## 9. Security & Role Authorization

- **Demo Session Auth:** Uses `x-demo-role` header (`operator` vs `doctor`).
- **Unauthenticated Requests:** Returns `HTTP 401 Unauthorized`.
- **Role Authorization:** `authorizeRole('doctor')` blocks Operators from diagnostic APIs (`/api/agent/*`, `/api/screenings/:id/review`, `/api/files/gradcam/*`) returning `HTTP 403 Forbidden`.
- **Server-Side Sanitization:** `roleSanitizer.js` strips Doctor-only fields before sending JSON to Operators.

**Implementation Status:** `IMPLEMENTED` (Demo Role Session Security)

---

## 10. Simulink System-Level Scalability Role

Simulink serves as a parallel system-level scalability demonstration representing:
- Patient arrival rates across multiple rural camps (100,000+ patients/year).
- Image acquisition & IQA throughput.
- Queue size & specialist review capacity modeling.
- Simulink is **NOT** in the live per-image React request path.

**Implementation Status:** `CONCEPTUAL / DEMONSTRATION`

---

## 11. Feature Implementation Matrix

| Feature | Implementation Status | Notes |
| :--- | :---: | :--- |
| **MATLAB Model Protection** | `IMPLEMENTED` | Files remain read-only black boxes. |
| **Patient Registration** | `IMPLEMENTED` | ID, Name, Age, Gender, Diabetes duration, Location. |
| **Fundus Image Upload** | `IMPLEMENTED` | Original byte stream preserved. |
| **IQA Hard Gate** | `IMPLEMENTED` | Focus, Illumination, FOV checked in `imageQualityCheck.m`. |
| **Recapture Workflow** | `IMPLEMENTED` | Halts DR model on failure, prompts for recapture. |
| **MATLAB ResNet-18 DR Grading** | `IMPLEMENTED` | 5-class grading (0-4) & Grad-CAM heatmap generation. |
| **Risk Triage Engine** | `IMPLEMENTED` | Grade 0-1 Routine vs Grade 2+ Referred (Medium/High/Urgent). |
| **Operator Camp Dashboard** | `IMPLEMENTED` | Displays operational counters & queue status. |
| **Doctor Priority Queue** | `IMPLEMENTED` | Queue sorted by Priority (URGENT > HIGH > MEDIUM) & waiting time. |
| **Two-Panel Grad-CAM Viewer** | `IMPLEMENTED` | Side-by-side Fundus vs Grad-CAM heatmap viewer. |
| **Human Review Separation** | `IMPLEMENTED` | `humanReview` sub-document stored separately without mutating AI result. |
| **Digital Report Generation** | `IMPLEMENTED` | `ReportViewer.jsx` printable/viewable report format. |
| **AI Screening Assistant** | `IMPLEMENTED` | Rule-based explanation layer (`aiAgentService.js`). |
| **Demo Role Security** | `IMPLEMENTED` | `authenticateUser` & `authorizeRole` middleware. |
| **Production JWT / OAuth** | `FUTURE` | Planned for future production deployment. |
| **Cloud LLM Integration** | `FUTURE` | Planned for future cloud agent integration. |
