/**
 * Error handling middleware
 * This middleware handles errors and sends appropriate responses
 */

// Handle 404 errors (Not Found)
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Handle all other errors
const errorHandler = (err, req, res, next) => {
  // Set status code (use 500 if status code is 200)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Set response status
  res.status(statusCode);
  
  // Send error response
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler }; 