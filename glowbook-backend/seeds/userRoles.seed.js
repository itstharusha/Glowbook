const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed data
const seedUsers = async () => {
  try {
    await connectDB();

    // Clear existing seed users (optional - remove if you want to keep existing data)
    await User.deleteMany({
      email: {
        $in: [
          'customer@glowbook.com',
          'vendor@glowbook.com',
          'admin@glowbook.com',
        ],
      },
    });
    console.log('Cleared existing seed users');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create seed users with different roles
    const seedData = [
      {
        name: 'Customer User',
        email: 'customer@glowbook.com',
        password: hashedPassword,
        role: 'customer',
        profilePhoto: '',
      },
      {
        name: 'Vendor User',
        email: 'vendor@glowbook.com',
        password: hashedPassword,
        role: 'vendor',
        profilePhoto: '',
      },
      {
        name: 'Admin User',
        email: 'admin@glowbook.com',
        password: hashedPassword,
        role: 'admin',
        profilePhoto: '',
      },
    ];

    // Insert seed data
    const createdUsers = await User.insertMany(seedData);
    console.log(`${createdUsers.length} users created successfully`);

    // Display created users
    createdUsers.forEach((user) => {
      console.log(`✓ ${user.role.toUpperCase()}: ${user.name} (${user.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedUsers();
