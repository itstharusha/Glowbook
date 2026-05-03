const mongoose = require('mongoose');

const portfolioItemSchema = new mongoose.Schema(
  {
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    stylistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stylist',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    images: [{ type: String }],
    category: {
      type: String,
      required: true,
      enum: ['Hair', 'Nails', 'Skin', 'Makeup', 'Spa', 'Waxing'],
    },
    tags: [{ type: String }],
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

portfolioItemSchema.index({ salonId: 1, isPublic: 1 });

module.exports = mongoose.model('PortfolioItem', portfolioItemSchema);
