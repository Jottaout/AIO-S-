const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { upload, setUploadFolder } = require('../middleware/upload');
const {
  getMyProfile, updateMyProfile, uploadLogo, uploadCover,
  listInstitutions, getPublicProfile,
  createPost, deletePost,
  createBranch, deleteBranch
} = require('../controllers/institutionController');

// ── Rotas públicas ──
router.get('/', protect, listInstitutions);
router.get('/:id', protect, getPublicProfile);

// ── Perfil próprio ──
router.get('/me/profile', protect, restrictTo('institution'), getMyProfile);
router.put('/me/profile', protect, restrictTo('institution'), updateMyProfile);
router.post('/me/logo',  protect, restrictTo('institution'), setUploadFolder('logos'),  upload.single('file'), uploadLogo);
router.post('/me/cover', protect, restrictTo('institution'), setUploadFolder('covers'), upload.single('file'), uploadCover);

// ── Publicações ──
router.post('/me/posts', protect, restrictTo('institution'), createPost);
router.delete('/me/posts/:postId', protect, restrictTo('institution'), deletePost);

// ── Unidades Orgânicas ──
router.post('/me/branches', protect, restrictTo('institution'), createBranch);
router.delete('/me/branches/:branchId', protect, restrictTo('institution'), deleteBranch);

module.exports = router;
