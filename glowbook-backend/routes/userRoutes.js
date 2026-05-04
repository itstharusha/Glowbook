const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadProfilePhoto, getAllUsers, deleteUser, updateUserRole } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);
router.get('/all', protect, admin, getAllUsers);
router.delete('/:id', protect, admin, deleteUser);
router.patch('/:id/role', protect, admin, updateUserRole);

module.exports = router;
