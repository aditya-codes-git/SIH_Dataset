const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');

const originalDir = path.resolve(__dirname, '../../uploads/original');
const gradcamDir = path.resolve(__dirname, '../../uploads/gradcam');

// GET /api/files/original/:filename - Serve original image (Authenticated users)
router.get('/original/:filename', authenticateUser, (req, res) => {
  const filePath = path.join(originalDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ status: 'FAILED', error: 'Original image file not found.' });
  }
});

// GET /api/files/gradcam/:filename - Serve Grad-CAM image (Authenticated users: Operator & Doctor)
router.get('/gradcam/:filename', authenticateUser, authorizeRole('operator', 'doctor'), (req, res) => {
  const filename = req.params.filename;
  let filePath = path.join(gradcamDir, filename);

  // Fallback check if filename lacks _gradcam suffix
  if (!fs.existsSync(filePath) && !filename.includes('_gradcam')) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const altPath = path.join(gradcamDir, `${base}_gradcam${ext || '.png'}`);
    if (fs.existsSync(altPath)) {
      filePath = altPath;
    }
  }

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ status: 'FAILED', error: 'Grad-CAM image file not found.' });
  }
});

// GET /api/files/results/:filename - Serve generated result assets (lesion overlays, landmark maps)
router.get('/results/:filename', authenticateUser, authorizeRole('operator', 'doctor'), (req, res) => {
  const filename = path.basename(req.params.filename); // Prevent path traversal
  const resultsDir = path.resolve(__dirname, '../../uploads/results');
  const filePath = path.join(resultsDir, filename);

  if (fs.existsSync(filePath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    if (filename.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filename.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
    res.sendFile(filePath);
  } else {
    res.status(404).json({ status: 'FAILED', error: 'Result asset file not found.' });
  }
});

module.exports = router;
