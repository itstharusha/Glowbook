const express = require('express');
const {
  createService,
  getServicesBySalon,
  updateService,
  deleteService,
  toggleServiceStatus,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const { isVendorOrAdmin } = require('../middleware/vendorMiddleware');

const router = express.Router();

router.post('/', protect, isVendorOrAdmin, createService);
router.get('/salon/:salonId', getServicesBySalon);
router.put('/:id', protect, isVendorOrAdmin, updateService);
router.delete('/:id', protect, isVendorOrAdmin, deleteService);
router.put('/:id/toggle', protect, isVendorOrAdmin, toggleServiceStatus);

module.exports = router;
