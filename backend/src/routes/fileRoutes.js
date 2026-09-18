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
    res.sendFile(filePath);
  } else {
    res.status(404).json({ status: 'FAILED', error: 'Grad-CAM image file not found.' });
  }
});

module.exports = router;
