const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a document name'],
    trim: true,
    maxlength: [100, 'Document name cannot be more than 100 characters']
  },
  content: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Document owner is required']
  },
  shared: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    access: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for faster queries
documentSchema.index({ owner: 1 });
documentSchema.index({ 'shared.user': 1 });

// Method to check if a user has access to this document
documentSchema.methods.hasAccess = function(userId) {
  // Convert userId to string for comparison
  const userIdStr = userId.toString();
  
  // If user is the owner, they have full edit access
  if (this.owner.toString() === userIdStr) {
    return 'edit';
  }
  
  // Check if user is in the shared list
  const sharedWith = this.shared.find(share => 
    share.user.toString() === userIdStr
  );
  
  // Return the access level or null if not shared
  return sharedWith ? sharedWith.access : null;
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document; 