const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes
 * Verifies JWT token and adds user to request object
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  // If no token
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};

/**
 * Middleware to check if user is admin
 * Must be used after protect middleware
 */
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin }; 