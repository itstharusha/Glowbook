const express = require('express');
const {
  createReview,
  getReviewsBySalon,
  deleteReview,
  getMyReviewForSalon,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public
router.get('/salon/:salonId', getReviewsBySalon);

// Protected — specific before /:id
router.get('/my/:salonId', protect, getMyReviewForSalon);
router.post('/', protect, createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
