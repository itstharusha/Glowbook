const express = require('express');
const {
  createSalon,
  getSalons,
  getMySalon,
  getSalon,
  updateSalon,
  deleteSalon,
} = require('../controllers/salonController');
const { protect } = require('../middleware/authMiddleware');
const { isVendor, isVendorOrAdmin } = require('../middleware/vendorMiddleware');

const router = express.Router();

router.get('/my', protect, isVendor, getMySalon);
router.route('/').post(protect, isVendor, createSalon).get(getSalons);
router.route('/:id').get(getSalon).put(protect, isVendorOrAdmin, updateSalon).delete(protect, isVendorOrAdmin, deleteSalon);

module.exports = router;
