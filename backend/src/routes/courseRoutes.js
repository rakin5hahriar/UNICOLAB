const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for /api/courses
router.route('/').get(getCourses).post(createCourse);

// Routes for /api/courses/:id
router.route('/:id').get(getCourse).put(updateCourse).delete(deleteCourse);

module.exports = router; 