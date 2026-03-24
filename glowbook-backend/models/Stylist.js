const mongoose = require('mongoose');

const stylistSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
  },
  specializations: [{
    type: String,
  }],
  portfolio: [{
    type: String,
  }],
  availability: {
    type: Object, // Structured availability Mon-Sun
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model('Stylist', stylistSchema);
