const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const seedUser = async () => {
  try {
    // Clear existing users
    await User.deleteMany({ email: 'test@example.com' });

    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      isAdmin: true,
    });

    console.log(`Created test user: ${user.email} (ID: ${user._id})`);
    console.log('Password: password123');
    
    // Exit process
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedUser(); 