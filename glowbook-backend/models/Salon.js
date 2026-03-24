const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  location: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Hair', 'Nails', 'Skin', 'Makeup', 'Spa', 'Waxing'],
  },
  openingHours: {
    type: String,
    required: true,
  },
  images: [
    {
      type: String,
    },
  ],
  avgRating: {
    type: Number,
    default: 0,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Salon', salonSchema);
