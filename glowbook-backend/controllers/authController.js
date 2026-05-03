const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }

    const allowedRoles = ['customer', 'vendor'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const userRole = role || 'customer';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
    });

    // Generate token
    const token = generateToken(user._id);

    // Return response (without password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      ownedSalon: user.ownedSalon
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
// @public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user (include password for comparison)
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return response (without password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      ownedSalon: user.ownedSalon
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @route   POST /api/auth/google
// @desc    Verify Google OAuth token and login/register user
// @public
const googleAuth = async (req, res) => {
  try {
    const { accessToken, role } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No access token provided',
      });
    }

    // Verify Google token
    const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { email, name, picture } = googleResponse.data;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Could not retrieve email from Google',
      });
    }

    const allowedRoles = ['customer', 'vendor'];
    const assignedRole = (role && allowedRoles.includes(role)) ? role : 'customer';

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        profilePhoto: picture || '',
        password: 'oauth_' + Math.random().toString(36).slice(2),
        role: assignedRole,
      });
    }

    // Generate token
    const token = generateToken(user._id);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      ownedSalon: user.ownedSalon,
    };

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to verify Google token',
    });
  }
};

// Fetch Apple's public keys and return the one matching the token's kid
const getApplePublicKey = async (kid) => {
  const { data } = await axios.get('https://appleid.apple.com/auth/keys');
  const key = data.keys.find((k) => k.kid === kid);
  if (!key) throw new Error('Apple public key not found for kid: ' + kid);

  // Convert JWK to PEM-compatible format using jsonwebtoken's built-in support
  // jwt.verify accepts a JWK object directly as of jsonwebtoken v9
  return key;
};

// @route   POST /api/auth/apple
// @desc    Verify Apple OAuth token and login/register user
// @public
const appleAuth = async (req, res) => {
  try {
    const { identityToken, email, name } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        message: 'No identity token provided',
      });
    }

    // Decode header to get kid + alg (without verifying yet)
    const tokenParts = identityToken.split('.');
    if (tokenParts.length !== 3) {
      return res.status(400).json({ success: false, message: 'Malformed identity token' });
    }
    const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString('utf8'));

    // Fetch Apple's matching public key
    const appleKey = await getApplePublicKey(header.kid);

    // Verify the JWT signature and claims against Apple's public key
    let payload;
    try {
      payload = jwt.verify(identityToken, jwt.createPublicKey({ key: appleKey, format: 'jwk' }), {
        algorithms: [header.alg || 'RS256'],
        issuer: 'https://appleid.apple.com',
      });
    } catch (verifyErr) {
      return res.status(401).json({ success: false, message: 'Apple identity token verification failed' });
    }

    // Apple provides email in the token payload (sub is the stable unique user ID)
    const appleUserId = payload.sub;
    const userEmail = email || payload.email || `apple_${appleUserId}@privaterelay.appleid.com`;
    const userName = name?.givenName || 'Apple User';

    let dbUser = await User.findOne({ email: userEmail });

    if (!dbUser) {
      dbUser = await User.create({
        name: userName,
        email: userEmail,
        profilePhoto: '',
        password: 'oauth_' + Math.random().toString(36).slice(2),
        role: 'customer',
      });
    }

    const token = generateToken(dbUser._id);

    const userResponse = {
      _id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      profilePhoto: dbUser.profilePhoto,
      ownedSalon: dbUser.ownedSalon,
    };

    res.status(200).json({
      success: true,
      message: 'Apple authentication successful',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to verify Apple token',
    });
  }
};

module.exports = { register, login, googleAuth, appleAuth };
