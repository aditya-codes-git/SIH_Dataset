# RetinoScan AI — Phase 4 Current Grad-CAM Implementation Audit

**Audit Date:** 2026-09-20  
**Scope:** Investigation of existing Grad-CAM pipeline in `drScreen.m`, `runScreeningFromFile.m`, and MATLAB inference runtime.

---

## 1. Technical Audit of Current Implementation

| Parameter | Current Production Implementation | Clinical & Engineering Limitation |
| :--- | :--- | :--- |
| **Network Architecture** | ResNet-18 (`DAGNetwork`, 71 layers) | Feature layer not explicitly pinned; relies on internal heuristic |
| **Feature Layer Used** | Implicit MATLAB default in `gradCAM(net, img, class)` | Default layer selection can pick sub-optimal abstraction layer |
| **Target Class** | `predictedClass` from `classify()` | Correctly uses predicted class, but without calibrated probabilities |
| **Input Image for Heatmap** | `imgPreprocessed` ($224 \times 224 \times 3$, Ben Graham enhanced) | Scaled down to $224 \times 224$; spatial resolution coarse |
| **Display Background Image** | `result.processedImage` ($224 \times 224$) | **Severe clinical issue:** Renders heatmap on Ben Graham contrast-subtracted image rather than original high-resolution fundus photograph |
| **Heatmap Resolution** | $224 \times 224$ | Low resolution; blocks fine anatomical localization |
| **Map Normalization** | Implicit within MATLAB `gradCAM()` | No explicit safeguard against contrast collapse or outlier spikes |
| **Alpha Transparency** | Hardcoded uniform `AlphaData = 0.35` across entire image | **Severe visual haze:** Healthy retina with zero model activation is covered with a 35% opaque blue fog |
| **Colormap** | Standard `jet` | Non-perceptually uniform; creates harsh artificial boundaries and saturated blue background |
| **Overlay Rendering** | MATLAB figure `imagesc()` + `exportgraphics(gca)` | Loses pixel aspect ratio and resolution of original fundus camera |
| **Hotspot Extraction** | **None** | No numerical coordinates, bounding boxes, strength metrics, or region ranking |
| **Asset Generation** | Single raster image (`<screeningId>_gradcam.png`) | Flattens all layers into a single 224x224 artifact; no separate raw heatmap or original image |

---

## 2. Root Cause Analysis: The "Blue Fog" & Resolution Loss

In `runScreeningFromFile.m` (lines 34–45):
```matlab
figure('Visible','off');
imshow(result.processedImage);
hold on;
imagesc(result.scoreMap, 'AlphaData', 0.35);
colormap jet;
axis off;
exportgraphics(gca, gradcamPath);
```

### Problems Identified:
1. **Uniform Alpha Fog:** Because `AlphaData` is set to `0.35` globally, every pixel in the $224 \times 224$ frame has $35\%$ opacity. Since `jet(1)` is deep blue, the entire non-activated background turns blue, obscuring retinal vessels, optic disc, and macula.
2. **Loss of Anatomical Context:** The background is `imgPreprocessed`, which underwent circular masking, cropping, and Graham-style local color averaging. Ophthalmologists require review on the original un-distorted fundus image.
3. **No Structural Metadata:** The frontend and doctor workstation receive only an opaque PNG file without interactive hotspot coordinates or explanation metadata.

---

## 3. Engineering Objectives for Improved Explainability

1. **Explicit Feature Layer Selection:** Audit candidate ResNet-18 convolutional layers (`res5b_relu`, `res5a_relu`, `res4b_relu`) for optimal localization.
2. **Inverse Spatial Mapping to Original Fundus:** Map heatmap activations back onto the original high-resolution camera coordinates ($H_{\text{orig}} \times W_{\text{orig}}$).
3. **Activation-Dependent Alpha Mask:** Dynamic transparency ($A = 0$ for low activation, smoothly ramping to $A \approx 0.65$ for strong attention) eliminating the blue haze.
4. **Perceptually Clear Palette:** Warm activation (yellow/orange/red) over a natural, uncolored fundus background.
5. **Multi-Asset Export:** Produce `original_fundus.png`, `gradcam_heatmap.png`, `gradcam_overlay.png`, and `attention_points.png`.
6. **Automated Hotspot Extraction:** Extract structured JSON attention hotspots with centroids, bounding boxes, areas, and strengths.
7. **Strict Labeling Governance:** Label regions as **"Model Attention Hotspots"**, NEVER as confirmed clinical lesions (e.g. microaneurysms or hemorrhages).
