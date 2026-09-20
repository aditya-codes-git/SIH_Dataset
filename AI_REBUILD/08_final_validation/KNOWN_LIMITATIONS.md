# RetinoScan AI — Known Limitations & Clinical Boundary Guidelines
**Document Purpose:** Transparency, Clinical Governance, and Risk Mitigation  
**Version:** 1.0.0 (Phase 7 Final)

---

## 1. Regulatory Status & Intended Use

> [!CAUTION]
> **RESEARCH & DECISION-SUPPORT PROTOTYPE ONLY**  
> RetinoScan AI is a prototype computer-aided detection (CADe) and triage software developed for academic and competition demonstration purposes. It is **not** cleared by CDSCO, US FDA, or CE as a standalone diagnostic medical device. It must not be used as the sole basis for clinical diagnosis or treatment without independent evaluation by a licensed ophthalmologist or retina specialist.

---

## 2. Unsupported Clinical Claims

The following claims are **explicitly unsupported** and must never be made in presentations, documentation, or promotional material:

1. **"100% Diagnostic Accuracy":** Deep learning models are probabilistic. While sensitivity on referable cases is high, false negatives and false positives occur.
2. **"Clinically Confirmed Lesions":** Visual lesion masks produced by the U-Net engine are **model-predicted approximations**. They are not biopsy-proven or expert-confirmed without clinician review.
3. **"Automated Macular Edema (DME) Diagnosis":** While hard exudates in the macula region indicate high DME risk, true DME diagnosis requires Optical Coherence Tomography (OCT) cross-sectional imaging to measure retinal thickening and subretinal fluid.
4. **"Neovascularization Confirmation":** Proliferative Diabetic Retinopathy (PDR) requires assessment of active neovascularization at the disc (NVD) or elsewhere (NVE), which typically requires stereoscopic fundus examination or fluorescein angiography.
5. **"Replacement of Ophthalmologists":** The platform is designed strictly for **triage, risk stratification, and workflow acceleration**, routing referable patients to specialists while enabling rapid review.

---

## 3. Algorithmic & Technical Limitations

### 3.1 Field of View & Camera Sensor Variability
- **Single-Field 45°/50° Fundus Photography:** The pipeline was calibrated and validated primarily on 45°–50° field-of-view color fundus photography (APTOS 2019 and IDRiD). Performance on ultra-widefield (UWF) photography, non-mydriatic handheld smartphone adapters, or slit-lamp photographs is degraded without domain adaptation.
- **Media Opacities:** Severe cataracts, dense vitreous hemorrhage, or uncleaned camera lenses produce optical blur that triggers the IQA hard gate or reduces lesion segmentation sensitivity.

### 3.2 Classical Morphological Landmark Localization
- **Optic Disc Localization:** The current optic disc algorithm utilizes circular Hough transform and intensity peak detection. In cases with heavy peripapillary atrophy (PPA) or extensive panretinal photocoagulation (PRP) scars near the disc, optic disc localization confidence may fall below 50%.
- **Macular Estimation:** The macula position is estimated relative to the optic disc using anatomical geometry (approximately 2.5 disc diameters temporal and slightly inferior) combined with green-channel foveal depression. In eyes with pathological myopia or severe tilt, this estimation is approximate.

### 3.3 Deep Learning Lesion Segmentation
- **Small Microaneurysms (< 15 µm):** Very subtle, single microaneurysms at the resolution limit of standard fundus cameras may be missed due to downsampling or noise.
- **Optic Disc Margin Exudates:** Highly reflective physiological cup margins can occasionally produce false-positive exudate responses; an optic disc suppression mask is applied to mitigate this, which may conversely mask true peripapillary exudates.
- **Inference Runtime:** Full pixel-level tiled U-Net inference on ultra-high resolution fundus images (4288x2848) requires approximately 30–50 seconds on standard CPU hardware without GPU batch acceleration.

---

## 4. Mitigation Strategies Implemented

| Limitation | Mitigation in RetinoScan AI |
|---|---|
| Deep network overconfidence | Temperature scaling calibration ($T = 1.8063$) on independent validation split |
| Garbage-in / Garbage-out | Strict automated IQA hard gate with immediate recapture notice |
| "Black Box" deep learning | Multi-scale fused Grad-CAM + numbered attention hotspots |
| False sense of certainty | All lesion findings explicitly labeled as *"Model-predicted lesion evidence only"* |
| Uncontrolled clinical changes | AI outputs stored immutably; clinician reviews stored in separate audit log |
| Operator confusion | Role-based UI stripping unreviewed internal saliency from non-medical operators |
