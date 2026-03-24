const Stylist = require('../models/Stylist');
const Salon = require('../models/Salon');

exports.createStylist = async (req, res) => {
  try {
    const salon = await Salon.findById(req.body.salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (salon.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot add stylists to another vendor\'s salon' });
    }

    const stylist = await Stylist.create(req.body);
    res.status(201).json({ success: true, data: stylist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStylistsBySalon = async (req, res) => {
  try {
    const stylists = await Stylist.find({ salonId: req.params.salonId });
    res.status(200).json({ success: true, count: stylists.length, data: stylists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStylist = async (req, res) => {
  try {
    let stylist = await Stylist.findById(req.params.id).populate('salonId');
    if (!stylist) {
      return res.status(404).json({ success: false, message: 'Stylist not found' });
    }

    if (stylist.salonId.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only manage stylists for your own salon' });
    }

    stylist = await Stylist.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: stylist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStylist = async (req, res) => {
  try {
    const stylist = await Stylist.findById(req.params.id).populate('salonId');
    if (!stylist) {
      return res.status(404).json({ success: false, message: 'Stylist not found' });
    }

    if (stylist.salonId.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only manage stylists for your own salon' });
    }

    await stylist.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
