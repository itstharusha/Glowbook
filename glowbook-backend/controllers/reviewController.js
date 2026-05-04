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

// @desc    Create a review for a specific completed appointment
// @route   POST /api/reviews
// @access  Private (customer)
exports.createReview = async (req, res) => {
  try {
    const { salonId, appointmentId, rating, comment } = req.body;

    if (!salonId || !appointmentId || !rating) {
      return res.status(400).json({ success: false, message: 'salonId, appointmentId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Verify the appointment belongs to this user, is at this salon, and is Completed
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: req.user._id,
      salonId,
      status: 'Completed',
    });
    if (!appointment) {
      return res.status(403).json({
        success: false,
        message: 'You can only review a completed appointment at this salon',
      });
    }

    // One review per booking
    const existing = await Review.findOne({ userId: req.user._id, appointmentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this appointment' });
    }

    const review = await Review.create({
      userId: req.user._id,
      salonId,
      appointmentId,
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

// @desc    Get all reviews by the current user (appointmentId + salonId only)
// @route   GET /api/reviews/my
// @access  Private
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id }).select('appointmentId salonId rating');
    res.json({ success: true, data: reviews });
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
