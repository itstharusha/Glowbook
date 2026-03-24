const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadProfilePhoto, getAllUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);
router.get('/all', protect, admin, getAllUsers);

module.exports = router;
