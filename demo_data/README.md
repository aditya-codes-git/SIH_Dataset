# RETINOSCAN AI — DEMO DATASET CATALOG

This directory contains verified, representative fundus test cases for live demonstrations, presentations, and automated clinical verification flows.

> [!IMPORTANT]
> **Data Integrity Notice:**
> The images in this folder are local copies of verified training and synthetic test samples intended solely for testing and demonstration. The original APTOS and IDRiD dataset archives remain completely untouched.

---

## Catalog of Demo Cases

| Filename | Clinical DR Class | Referable Status | Pathological Highlights & Expected Findings |
| :--- | :--- | :--- | :--- |
| `demo_grade_0_normal.png` | **Grade 0 — No Apparent DR** | **Non-Referable** | Clear retinal field, distinct optic disc, well-defined macula, healthy vascular caliber. Zero significant lesions. Routine follow-up. |
| `demo_grade_1_mild.png` | **Grade 1 — Mild NPDR** | **Non-Referable** | Isolated punctate microaneurysms. Normal macula. Non-referable clinical routing. Routine annual re-screening. |
| `demo_grade_2_moderate.png` | **Grade 2 — Moderate NPDR** | **Referable DR** | Multiple microaneurysms, blot haemorrhages, and hard exudates. Referable threshold reached ($\ge \text{Grade } 2$). Routes to Ophthalmologist queue with MEDIUM priority. |
| `demo_grade_3_severe.png` | **Grade 3 — Severe NPDR** | **Referable DR** | Extensive retinal hemorrhages (4 quadrants), venous beading, cotton-wool spots / soft exudates. Routes to Ophthalmologist queue with HIGH priority. |
| `demo_grade_4_proliferative.png` | **Grade 4 — Proliferative DR** | **Referable DR** | Extensive neovascularization, vitreous/preretinal hemorrhage risk, advanced exudation. Urgent clinical routing with URGENT priority. |
| `demo_ungradable_poor_illumination.png` | **UNGRADABLE** | **Recapture Required** | Severely under-illuminated, flat contrast fundus image failing Image Quality Assessment (IQA Hard Gate). Zero fake DR diagnosis or lesion claim; triggers instant recapture warning for operator. |

---

## Verification Usage

To run automated screening on any demo case via the API or MATLAB:
```bash
# Node.js backend integration test
node -e "
const matlabService = require('./backend/src/services/matlab/matlabService');
matlabService.runScreening('demo_data/demo_grade_2_moderate.png', 'DEMO_TEST_01')
  .then(res => console.log('Screening Outcome:', res.status, 'Grade:', res.drGrade, 'Referable:', res.referable));
"
```
