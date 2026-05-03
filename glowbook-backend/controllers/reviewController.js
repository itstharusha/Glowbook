const Review = require('../models/Review');
const Salon = require('../models/Salon');
const Appointment = require('../models/Appointment');

const updateSalonAvgRating = async (salonId) => {
  const reviews = await Review.find({ salonId });
  const avg = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  await Salon.findByIdAndUpdate(salonId, { avgRating: parseFloat(avg.toFixed(1)) });
};

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private (customer)
exports.createReview = async (req, res) => {
  try {
    const { salonId, rating, comment } = req.body;

    if (!salonId || !rating) {
      return res.status(400).json({ success: false, message: 'salonId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Must have a completed appointment at this salon
    const completedApt = await Appointment.findOne({
      userId: req.user._id,
      salonId,
      status: 'Completed',
    });
    if (!completedApt) {
      return res.status(403).json({
        success: false,
        message: 'You can only review salons where you have a completed appointment',
      });
    }

    // One review per user per salon
    const existing = await Review.findOne({ userId: req.user._id, salonId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this salon' });
    }

    const review = await Review.create({
      userId: req.user._id,
      salonId,
      rating: Math.round(rating),
      comment: comment?.trim() || '',
    });

    await updateSalonAvgRating(salonId);

    const populated = await Review.findById(review._id).populate('userId', 'name profilePhoto');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews for a salon
// @route   GET /api/reviews/salon/:salonId
// @access  Public
exports.getReviewsBySalon = async (req, res) => {
  try {
    const reviews = await Review.find({ salonId: req.params.salonId })
      .populate('userId', 'name profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (own review or admin)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your review' });
    }

    const { salonId } = review;
    await review.deleteOne();
    await updateSalonAvgRating(salonId);

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check if current user has reviewed a salon
// @route   GET /api/reviews/my/:salonId
// @access  Private
exports.getMyReviewForSalon = async (req, res) => {
  try {
    const review = await Review.findOne({
      userId: req.user._id,
      salonId: req.params.salonId,
    });
    res.json({ success: true, data: review || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
