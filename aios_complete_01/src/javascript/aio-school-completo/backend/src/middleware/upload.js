const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garante que a pasta de uploads existe
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Subpasta por tipo: uploads/avatars, uploads/logos, uploads/covers
    const subfolder = req.uploadSubfolder || 'misc';
    const fullPath = path.join(uploadDir, subfolder);
    if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${req.user?.id || 'anon'}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const allowedTypes = /jpeg|jpg|png|webp|gif/;

function fileFilter(req, file, cb) {
  const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedTypes.test(file.mimetype);
  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (jpg, png, webp, gif).'));
  }
}

const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024 }
});

/**
 * Middleware factory que define a subpasta antes de aplicar o multer.
 * Uso: router.post('/avatar', setUploadFolder('avatars'), upload.single('file'), handler)
 */
function setUploadFolder(folderName) {
  return (req, res, next) => {
    req.uploadSubfolder = folderName;
    next();
  };
}

module.exports = { upload, setUploadFolder };
