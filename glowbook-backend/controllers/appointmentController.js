const Appointment = require('../models/Appointment');
const Salon = require('../models/Salon');

exports.getVendorAppointments = async (req, res) => {
  try {
    const salon = await Salon.findOne({ owner: req.user._id });
    if (!salon) {
      return res.status(404).json({ message: 'No salon found' });
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

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

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

    appointment.status = status;
    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
