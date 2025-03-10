const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

// Get all courses and create a new course
router.route('/')
  .get(protect, getCourses)
  .post(protect, createCourse);

// Get, update, and delete a course by ID
router.route('/:id')
  .get(protect, getCourse)
  .put(protect, updateCourse)
  .delete(protect, deleteCourse);

module.exports = router; 