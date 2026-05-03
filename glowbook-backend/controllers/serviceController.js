const Service = require('../models/Service');
const Salon = require('../models/Salon');

exports.createService = async (req, res) => {
  try {
    const { salonId, name, category, description, price, duration, image } = req.body;

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (salon.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot add services to another vendor\'s salon' });
    }

    const service = await Service.create({ salonId, name, category, description, price, duration, image });
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getServicesBySalon = async (req, res) => {
  try {
    const services = await Service.find({ salonId: req.params.salonId });
    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id).populate('salonId');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (service.salonId.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only manage services for your own salon' });
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('salonId');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (service.salonId.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only manage services for your own salon' });
    }

    await service.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('salonId');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (service.salonId.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only manage services for your own salon' });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
