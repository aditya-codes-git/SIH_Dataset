const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.resolve(__dirname, '../../uploads/original');

// Ensure destination upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure gradcam and results directories exist
const gradcamDir = path.resolve(__dirname, '../../uploads/gradcam');
if (!fs.existsSync(gradcamDir)) {
  fs.mkdirSync(gradcamDir, { recursive: true });
}

const resultsDir = path.resolve(__dirname, '../../uploads/results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const lesionMasksDir = path.resolve(__dirname, '../../uploads/results/lesion_masks');
if (!fs.existsSync(lesionMasksDir)) {
  fs.mkdirSync(lesionMasksDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const screeningId = req.screeningId || uuidv4();
    req.screeningId = screeningId;
    cb(null, `${screeningId}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp'];
  if (allowedTypes.includes(file.mimetype.toLowerCase()) || file.originalname.match(/\.(png|jpe?g|tiff?|bmp)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image file type. Please upload a PNG, JPEG, TIFF, or BMP image.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

module.exports = upload;
