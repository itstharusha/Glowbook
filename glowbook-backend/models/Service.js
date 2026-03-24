const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true, // in minutes
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
