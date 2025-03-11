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

      if (!req.user) {
        return res.status(401).json({ message: 'User not found, token is invalid' });
      }

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

/**
 * Middleware to check if user is admin
 * Must be used after protect middleware
 */
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin }; 