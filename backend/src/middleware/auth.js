const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate users
 * Verifies JWT token and adds user info to request object
 */
const authenticateUser = async (req, res, next) => {
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

      // Add user ID to request
      req.user = {
        userId: decoded.id
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    // If no token
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { authenticateUser }; 