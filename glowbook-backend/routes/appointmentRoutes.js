const express = require('express');
const {
  getVendorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAllAppointments,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { isVendor, isVendorOrAdmin } = require('../middleware/vendorMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

// Specific routes BEFORE parameterized routes
router.get('/admin/all', protect, admin, getAllAppointments);
router.get('/vendor-salon', protect, isVendor, getVendorAppointments);
router.get('/my', protect, getMyAppointments);
router.post('/', protect, bookAppointment);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/status', protect, isVendorOrAdmin, updateAppointmentStatus);
router.get('/:id', protect, isVendorOrAdmin, getAppointmentById);

module.exports = router;
