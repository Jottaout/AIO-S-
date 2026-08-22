const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { upload, setUploadFolder } = require('../middleware/upload');
const {
  getMyProfile, updateMyProfile, uploadAvatar, listTeachers, getPublicProfile
} = require('../controllers/teacherController');

// ── Rotas públicas (qualquer utilizador autenticado pode ver) ──
router.get('/', protect, listTeachers);
router.get('/:id', protect, getPublicProfile);

// ── Rotas privadas (só o próprio professor) ──
router.get('/me/profile', protect, restrictTo('teacher'), getMyProfile);
router.put('/me/profile', protect, restrictTo('teacher'), updateMyProfile);
router.post('/me/avatar', protect, restrictTo('teacher'), setUploadFolder('avatars'), upload.single('file'), uploadAvatar);

module.exports = router;
