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
} = require('../controllers/salonController');
const { protect } = require('../middleware/authMiddleware');
const { isVendor, isVendorOrAdmin } = require('../middleware/vendorMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/admin/stats', protect, admin, getAdminStats);
router.get('/my', protect, isVendor, getMySalon);
router.route('/').post(protect, isVendor, createSalon).get(getSalons);
router.patch('/:id/verify', protect, admin, verifySalon);
router.route('/:id').get(getSalon).put(protect, isVendorOrAdmin, updateSalon).delete(protect, isVendorOrAdmin, deleteSalon);

module.exports = router;
