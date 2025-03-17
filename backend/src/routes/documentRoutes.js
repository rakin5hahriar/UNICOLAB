const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const Document = require('../models/Document');
const User = require('../models/User');

// Get all documents for the authenticated user
router.get('/', authenticateUser, async (req, res) => {
  try {
    // Find documents where user is owner or collaborator
    const documents = await Document.find({
      $or: [
        { owner: req.user.userId },
        { collaborators: req.user.userId },
        { isPublic: true }
      ]
    })
      .populate('owner', 'username email')
      .populate('collaborators', 'username email')
      .sort({ updatedAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get documents for a specific workspace
router.get('/workspace/:workspaceId', authenticateUser, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Find documents in the workspace where user is owner or collaborator
    const documents = await Document.find({
      workspace: workspaceId,
      $or: [
        { owner: req.user.userId },
        { collaborators: req.user.userId },
        { isPublic: true }
      ]
    })
      .populate('owner', 'username email')
      .populate('collaborators', 'username email')
      .sort({ updatedAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching workspace documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single document by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators', 'username email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access to the document
    const isOwner = document.owner._id.toString() === req.user.userId;
    const isCollaborator = document.collaborators.some(
      collaborator => collaborator._id.toString() === req.user.userId
    );
    const isPublic = document.isPublic;

    if (!isOwner && !isCollaborator && !isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new document
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, content, workspaceId, isPublic } = req.body;
    
    // Create default content if none provided
    const defaultContent = JSON.stringify([
      {
        type: 'paragraph',
        children: [
          { text: 'Start typing here...' }
        ],
      },
    ]);

    const document = new Document({
      title,
      content: content || defaultContent,
      workspace: workspaceId,
      owner: req.user.userId,
      isPublic: isPublic || false
    });

    await document.save();

    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a document
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    console.log('Update document request received:', req.params.id);
    console.log('Request body:', req.body);
    
    const { title, content, isPublic } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is owner or collaborator
    const isOwner = document.owner.toString() === req.user.userId;
    const isCollaborator = document.collaborators.some(
      collaborator => collaborator.toString() === req.user.userId
    );

    if (!isOwner && !isCollaborator) {
      console.log('Access denied for user:', req.user.userId);
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update document fields
    if (title !== undefined) document.title = title;
    if (content !== undefined) {
      console.log('Updating document content');
      document.content = content;
    }
    if (isPublic !== undefined && isOwner) document.isPublic = isPublic;

    await document.save();
    console.log('Document updated successfully');

    res.status(200).json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a document
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only the owner can delete a document
    if (document.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Document.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a collaborator to a document
router.post('/:id/collaborators', authenticateUser, async (req, res) => {
  try {
    console.log('Add collaborator request received for document:', req.params.id);
    console.log('Request body:', req.body);
    
    const { email } = req.body;
    
    if (!email) {
      console.log('Email is required but was not provided');
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const document = await Document.findById(req.params.id);

    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only the owner can add collaborators
    if (document.owner.toString() !== req.user.userId) {
      console.log('Access denied for user:', req.user.userId, 'Only the owner can add collaborators');
      return res.status(403).json({ message: 'Access denied. Only the owner can add collaborators' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check if user is already a collaborator
    if (document.collaborators.some(collab => collab.toString() === user._id.toString())) {
      console.log('User is already a collaborator:', email);
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    // Add user to collaborators
    document.collaborators.push(user._id);
    await document.save();
    console.log('Collaborator added successfully:', email);

    const updatedDocument = await Document.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators', 'username email');

    res.status(200).json(updatedDocument);
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Remove a collaborator from a document
router.delete('/:id/collaborators/:userId', authenticateUser, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only the owner can remove collaborators
    if (document.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove user from collaborators
    document.collaborators = document.collaborators.filter(
      collaborator => collaborator.toString() !== req.params.userId
    );
    
    await document.save();

    const updatedDocument = await Document.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators', 'username email');

    res.status(200).json(updatedDocument);
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 