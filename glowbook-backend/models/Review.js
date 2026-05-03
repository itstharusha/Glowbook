const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
}, { timestamps: true });

reviewSchema.index({ salonId: 1 });
reviewSchema.index({ userId: 1, salonId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
