const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getWorkspaceItems,
  getWorkspaceItem,
  createWorkspaceItem,
  updateWorkspaceItem,
  deleteWorkspaceItem
} = require('../controllers/workspaceItemController');

// Get all workspace items for a workspace
router.get('/workspace/:workspaceId', protect, getWorkspaceItems);

// Get a single workspace item
router.get('/:id', protect, getWorkspaceItem);

// Create a new workspace item
router.post('/', protect, createWorkspaceItem);

// Update a workspace item
router.put('/:id', protect, updateWorkspaceItem);

// Delete a workspace item
router.delete('/:id', protect, deleteWorkspaceItem);

module.exports = router; 