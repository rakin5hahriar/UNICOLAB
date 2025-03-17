const express = require('express');
const router = express.Router();
const TextDocument = require('../models/TextDocument');
const auth = require('../middleware/auth');

// Create a new document
router.post('/documents', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const document = new TextDocument({
      title: title || 'Untitled Document',
      content: content || '',
      owner: req.user.id,
      collaborators: [req.user.id]
    });
    await document.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error creating document', error: error.message });
  }
});

// Get all documents for a user
router.get('/documents', auth, async (req, res) => {
  try {
    const documents = await TextDocument.find({
      collaborators: req.user.id
    }).sort({ updatedAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
});

// Get a specific document
router.get('/documents/:id', auth, async (req, res) => {
  try {
    const document = await TextDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (!document.collaborators.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document', error: error.message });
  }
});

// Update a document
router.put('/documents/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const document = await TextDocument.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    if (!document.collaborators.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    document.title = title || document.title;
    document.content = content || document.content;
    document.lastModifiedBy = req.user.id;
    
    await document.save();
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error updating document', error: error.message });
  }
});

// Delete a document
router.delete('/documents/:id', auth, async (req, res) => {
  try {
    const document = await TextDocument.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete the document' });
    }
    
    await document.remove();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
});

// Add a collaborator to a document
router.post('/documents/:id/collaborators', auth, async (req, res) => {
  try {
    const { collaboratorId } = req.body;
    const document = await TextDocument.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can add collaborators' });
    }
    
    if (!document.collaborators.includes(collaboratorId)) {
      document.collaborators.push(collaboratorId);
      await document.save();
    }
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error adding collaborator', error: error.message });
  }
});

module.exports = router; 