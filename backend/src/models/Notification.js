const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error'], 
    default: 'info' 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceItem',
    required: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema); 