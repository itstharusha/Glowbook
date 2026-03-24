const express = require('express');
const { register, login, googleAuth, appleAuth } = require('../controllers/authController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/google
// @desc    Google OAuth authentication
// @access  Public
router.post('/google', googleAuth);

// @route   POST /api/auth/apple
// @desc    Apple OAuth authentication
// @access  Public
router.post('/apple', appleAuth);

module.exports = router;
