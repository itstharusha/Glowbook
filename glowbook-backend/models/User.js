const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // Don't send password by default
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin'],
    default: 'customer',
  },
  profilePhoto: {
    type: String,
    default: '',
  },
  savedSalons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
    },
  ],
  ownedSalon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
