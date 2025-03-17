const mongoose = require('mongoose');

// Default Slate content
const defaultSlateContent = JSON.stringify([
  {
    type: 'paragraph',
    children: [
      { text: 'Start typing here...' }
    ],
  },
]);

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: defaultSlateContent
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastModified timestamp on save
DocumentSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

// Add index for faster queries
DocumentSchema.index({ owner: 1 });
DocumentSchema.index({ 'collaborators': 1 });

// Method to check if a user has access to this document
DocumentSchema.methods.hasAccess = function(userId) {
  // Convert userId to string for comparison
  const userIdStr = userId.toString();
  
  // If user is the owner, they have full edit access
  if (this.owner.toString() === userIdStr) {
    return 'edit';
  }
  
  // Check if user is in the collaborators list
  const collaborator = this.collaborators.find(collaborator => 
    collaborator.toString() === userIdStr
  );
  
  // Return the access level or null if not shared
  return collaborator ? 'edit' : null;
};

module.exports = mongoose.model('Document', DocumentSchema); 