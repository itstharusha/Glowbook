const express = require('express');
const {
  createSalon,
  getSalons,
  getMySalon,
  getSalon,
  updateSalon,
  deleteSalon,
  verifySalon,
  getAdminStats,
  addImagesToSalon,
  removeImageFromSalon,
} = require('../controllers/salonController');
const { protect } = require('../middleware/authMiddleware');
const { isVendor, isVendorOrAdmin } = require('../middleware/vendorMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.get('/admin/stats', protect, admin, getAdminStats);
router.get('/my', protect, isVendor, getMySalon);
router.route('/').post(protect, isVendor, createSalon).get(getSalons);
router.patch('/:id/verify', protect, admin, verifySalon);
router.post('/:id/images', protect, isVendorOrAdmin, upload.array('images', 5), addImagesToSalon);
router.delete('/:id/images', protect, isVendorOrAdmin, removeImageFromSalon);
router.route('/:id').get(getSalon).put(protect, isVendorOrAdmin, updateSalon).delete(protect, isVendorOrAdmin, deleteSalon);

module.exports = router;
