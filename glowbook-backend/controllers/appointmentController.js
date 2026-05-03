const Appointment = require('../models/Appointment');
const Salon = require('../models/Salon');
const Service = require('../models/Service');
const Stylist = require('../models/Stylist');

// @desc    Customer books an appointment
// @route   POST /api/appointments
// @access  Private (customer)
exports.bookAppointment = async (req, res) => {
  try {
    const { salonId, serviceId, stylistId, date, timeSlot, notes } = req.body;

    if (!salonId || !serviceId || !stylistId || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'salonId, serviceId, stylistId, date, and timeSlot are required' });
    }

    // Validate date is not in the past
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    if (appointmentDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Appointment date must be in the future' });
    }

    // Verify service belongs to this salon and is active
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (service.salonId.toString() !== salonId.toString()) {
      return res.status(400).json({ success: false, message: 'Service does not belong to this salon' });
    }
    if (!service.isActive) {
      return res.status(400).json({ success: false, message: 'This service is not currently available' });
    }

    // Verify stylist belongs to this salon
    const stylist = await Stylist.findById(stylistId);
    if (!stylist) {
      return res.status(404).json({ success: false, message: 'Stylist not found' });
    }
    if (stylist.salonId.toString() !== salonId.toString()) {
      return res.status(400).json({ success: false, message: 'Stylist does not belong to this salon' });
    }

    // Prevent double-booking: same stylist, same date, same time slot, not cancelled
    const conflict = await Appointment.findOne({
      stylistId,
      date: appointmentDate,
      timeSlot,
      status: { $in: ['Pending', 'Confirmed'] },
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked for the selected stylist' });
    }

    const appointment = await Appointment.create({
      userId: req.user._id,
      salonId,
      serviceId,
      stylistId,
      date: appointmentDate,
      timeSlot,
      notes: notes || '',
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('salonId', 'name location')
      .populate('serviceId', 'name price duration')
      .populate('stylistId', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current customer's appointments
// @route   GET /api/appointments/my
// @access  Private (customer)
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id })
      .populate('salonId', 'name location images')
      .populate('serviceId', 'name price duration')
      .populate('stylistId', 'name')
      .sort({ date: -1 });

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Customer cancels their appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (customer)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your appointment' });
    }
    if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${appointment.status} appointment` });
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single appointment by ID (vendor must own the salon, or admin)
// @route   GET /api/appointments/:id
// @access  Private (vendor, admin)
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('userId', 'name email profilePhoto')
      .populate('serviceId', 'name price duration')
      .populate('stylistId', 'name')
      .populate('salonId', 'name owner');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (
      appointment.salonId.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'This booking is not at your salon' });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVendorAppointments = async (req, res) => {
  try {
    const salon = await Salon.findOne({ owner: req.user._id });
    if (!salon) {
      return res.status(404).json({ success: false, message: 'No salon found' });
    }

    const appointments = await Appointment.find({ salonId: salon._id })
      .populate('userId', 'name email profilePhoto')
      .populate('serviceId', 'name price duration')
      .populate('stylistId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const VALID_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const VALID_TRANSITIONS = {
  Pending:   ['Confirmed', 'Cancelled'],
  Confirmed: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const vendorAllowedStatuses = ['Confirmed', 'Completed'];
    if (req.user.role === 'vendor' && !vendorAllowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Vendors can only confirm or complete bookings' });
    }

    const appointment = await Appointment.findById(id).populate('salonId');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.salonId.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'This booking is not at your salon' });
    }

    if (!VALID_TRANSITIONS[appointment.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${appointment.status} to ${status}`,
      });
    }

    appointment.status = status;
    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all appointments (admin view)
// @route   GET /api/appointments/admin/all
// @access  Private/Admin
exports.getAllAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate('userId', 'name email')
      .populate('serviceId', 'name price duration')
      .populate('stylistId', 'name')
      .populate('salonId', 'name')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
