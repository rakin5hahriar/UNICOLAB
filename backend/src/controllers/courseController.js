const Course = require('../models/Course');
const mongoose = require('mongoose');

// @desc    Get all courses for the logged-in user
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single course
// @route   GET /api/courses/:id
// @access  Private
const getCourse = async (req, res) => {
  try {
    // Validate if the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the course belongs to the user
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this course' });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private
const createCourse = async (req, res) => {
  try {
    const { title, code, description, instructor, semester, year } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Course title is required' });
    }

    const course = await Course.create({
      title,
      code,
      description,
      instructor,
      semester,
      year,
      user: req.user.id,
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create course',
      error: error.toString(),
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private
const updateCourse = async (req, res) => {
  try {
    // Validate if the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    const { title, code, description, instructor, semester, year } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the course belongs to the user
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    course.title = title || course.title;
    course.code = code || course.code;
    course.description = description || course.description;
    course.instructor = instructor || course.instructor;
    course.semester = semester || course.semester;
    course.year = year || course.year;

    const updatedCourse = await course.save();

    res.status(200).json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private
const deleteCourse = async (req, res) => {
  try {
    // Validate if the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the course belongs to the user
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await course.deleteOne();

    res.status(200).json({ message: 'Course removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
}; 