const express = require('express');
const {
  createStylist,
  getStylistsBySalon,
  updateStylist,
  deleteStylist,
} = require('../controllers/stylistController');
const { protect } = require('../middleware/authMiddleware');
const { isVendorOrAdmin } = require('../middleware/vendorMiddleware');

const router = express.Router();

router.post('/', protect, isVendorOrAdmin, createStylist);
router.get('/salon/:salonId', getStylistsBySalon);
router.put('/:id', protect, isVendorOrAdmin, updateStylist);
router.delete('/:id', protect, isVendorOrAdmin, deleteStylist);

module.exports = router;
