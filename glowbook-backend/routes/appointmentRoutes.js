const express = require('express');
const {
  getVendorAppointments,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { isVendor, isVendorOrAdmin } = require('../middleware/vendorMiddleware');

const router = express.Router();

router.get('/vendor-salon', protect, isVendor, getVendorAppointments);
router.put('/:id/status', protect, isVendorOrAdmin, updateAppointmentStatus);

module.exports = router;
