const mongoose = require('mongoose');

const workspaceItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Item type is required'],
      enum: ['note', 'assignment', 'reading', 'pdf', 'document', 'video', 'other'],
      default: 'note',
    },
    content: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      default: '',
    },
    // For YouTube videos and other embeds
    embedUrl: {
      type: String,
      default: '',
    },
    // For document links (Google Docs, OneDrive, etc.)
    documentUrl: {
      type: String,
      default: '',
    },
    documentProvider: {
      type: String,
      enum: ['', 'google', 'microsoft', 'dropbox', 'other'],
      default: '',
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    dueDate: {
      type: Date,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    tags: [{
      type: String,
      trim: true
    }],
  },
  {
    timestamps: true,
  }
);

const WorkspaceItem = mongoose.model('WorkspaceItem', workspaceItemSchema);

module.exports = WorkspaceItem; 