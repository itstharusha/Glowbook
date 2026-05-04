const express = require('express');
const {
  createReview,
  getReviewsBySalon,
  getMyReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public
router.get('/salon/:salonId', getReviewsBySalon);

// Protected — /my must come before /:id
router.get('/my', protect, getMyReviews);
router.post('/', protect, createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
