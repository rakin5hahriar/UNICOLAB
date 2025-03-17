const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [100, 'Course title cannot exceed 100 characters']
    },
    code: {
      type: String,
      trim: true,
      maxlength: [10, 'Course code cannot exceed 10 characters']
    },
    description: {
      type: String,
      trim: true,
    },
    instructor: {
      type: String,
      trim: true,
    },
    semester: {
      type: String,
      trim: true,
      enum: {
        values: ['Fall', 'Spring', 'Summer', 'Winter', ''],
        message: '{VALUE} is not a valid semester'
      }
    },
    year: {
      type: Number,
      min: [2000, 'Year must be 2000 or later'],
      max: [2100, 'Year must be 2100 or earlier']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to ensure title is not empty
courseSchema.pre('save', function(next) {
  if (!this.title || this.title.trim() === '') {
    const error = new Error('Course title is required');
    return next(error);
  }
  next();
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course; 