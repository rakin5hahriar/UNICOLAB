const mongoose = require('mongoose');

const textDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Document'
  },
  content: {
    type: String,
    default: ''
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
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  format: {
    type: Object,
    default: {
      font: 'Arial',
      fontSize: '12px',
      lineHeight: '1.5',
      textAlign: 'left',
      color: '#000000',
      backgroundColor: '#ffffff'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TextDocument', textDocumentSchema); 