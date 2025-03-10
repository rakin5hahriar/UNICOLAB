const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspacesByCourse
} = require('../controllers/workspaceController');

// Get all workspaces and create a new workspace
router.route('/')
  .get(protect, getWorkspaces)
  .post(protect, createWorkspace);

// Get workspaces by course
router.get('/course/:courseId', protect, getWorkspacesByCourse);

// Get, update, and delete a workspace by ID
router.route('/:id')
  .get(protect, getWorkspace)
  .put(protect, updateWorkspace)
  .delete(protect, deleteWorkspace);

module.exports = router; 