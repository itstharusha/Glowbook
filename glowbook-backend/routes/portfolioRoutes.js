const express = require('express');
const router  = express.Router();

const {
  createPortfolioItem,
  getPortfoliosBySalon,
  getVendorPortfolios,
  getPortfolioItem,
  updatePortfolioItem,
  addImagesToItem,
  removeImageFromItem,
  deletePortfolioItem,
} = require('../controllers/portfolioController');

const { protect }              = require('../middleware/authMiddleware');
const { isVendor, isVendorOrAdmin } = require('../middleware/vendorMiddleware');
const { uploadPortfolio }      = require('../config/cloudinary');

// Public routes — must be defined before /:id to avoid Express matching 'my' as an ObjectId
router.get('/salon/:salonId', getPortfoliosBySalon);

// Vendor-only aggregate (all items including drafts)
// MUST come before /:id
router.get('/my', protect, isVendor, getVendorPortfolios);

// Single item — public (controller enforces isPublic check internally)
router.get('/:id', getPortfolioItem);

// Create (vendor or admin)
router.post(
  '/',
  protect,
  isVendorOrAdmin,
  uploadPortfolio.array('images', 5),
  createPortfolioItem
);

// Update text fields only
router.put('/:id', protect, isVendorOrAdmin, updatePortfolioItem);

// Append more images to existing item
router.post(
  '/:id/images',
  protect,
  isVendorOrAdmin,
  uploadPortfolio.array('images', 5),
  addImagesToItem
);

// Remove a single image from an item
router.delete('/:id/images', protect, isVendorOrAdmin, removeImageFromItem);

// Delete entire portfolio item
router.delete('/:id', protect, isVendorOrAdmin, deletePortfolioItem);

module.exports = router;
