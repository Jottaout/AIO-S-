const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { upload, setUploadFolder } = require('../middleware/upload');
const { getMyProfile, updateMyProfile, uploadAvatar } = require('../controllers/studentController');

router.use(protect, restrictTo('student'));

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.post('/me/avatar', setUploadFolder('avatars'), upload.single('file'), uploadAvatar);

module.exports = router;
