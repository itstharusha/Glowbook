const Salon = require('../models/Salon');
const Service = require('../models/Service');
const Stylist = require('../models/Stylist');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const User = require('../models/User');

exports.createSalon = async (req, res) => {
  try {
    const existingSalon = await Salon.findOne({ owner: req.user._id });
    if (existingSalon) {
      return res.status(400).json({ success: false, message: 'You already have a registered salon. Edit your existing salon instead.' });
    }

    const salonData = { ...req.body, owner: req.user._id };
    const newSalon = await Salon.create(salonData);

    await User.findByIdAndUpdate(req.user._id, { ownedSalon: newSalon._id });

    res.status(201).json({ success: true, data: newSalon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalons = async (req, res) => {
  try {
    const salons = await Salon.find();
    res.status(200).json({ success: true, count: salons.length, data: salons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMySalon = async (req, res) => {
  try {
    const salon = await Salon.findOne({ owner: req.user._id });
    if (!salon) {
      return res.status(200).json({ success: true, data: null, hasSalon: false });
    }
    res.status(200).json({ success: true, data: salon, hasSalon: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    res.status(200).json({ success: true, data: salon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSalon = async (req, res) => {
  try {
    let salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (salon.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only edit your own salon' });
    }

    salon = await Salon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: salon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (salon.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own salon' });
    }

    await Service.deleteMany({ salonId: salon._id });
    await Stylist.deleteMany({ salonId: salon._id });
    await Appointment.deleteMany({ salonId: salon._id });
    await Review.deleteMany({ salonId: salon._id });

    await User.findByIdAndUpdate(req.user._id, { ownedSalon: null });
    await salon.deleteOne(); // Use deleteOne instead of remove in modern Mongoose
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
