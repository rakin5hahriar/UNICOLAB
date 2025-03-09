const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    color: {
      type: String,
      default: '#3498db', // Default color
    },
    icon: {
      type: String,
      default: 'book', // Default icon
    },
  },
  {
    timestamps: true,
  }
);

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace; 