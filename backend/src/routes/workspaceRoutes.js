const express = require('express');
const {
  getWorkspaces,
  getWorkspacesByCourse,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} = require('../controllers/workspaceController');
const {
  getWorkspaceItems,
  getWorkspaceItem,
  createWorkspaceItem,
  updateWorkspaceItem,
  deleteWorkspaceItem,
} = require('../controllers/workspaceItemController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Workspace routes
router.route('/').get(getWorkspaces).post(createWorkspace);
router.route('/course/:courseId').get(getWorkspacesByCourse);
router.route('/:id').get(getWorkspace).put(updateWorkspace).delete(deleteWorkspace);

// Workspace item routes
router.route('/:workspaceId/items').get(getWorkspaceItems).post(createWorkspaceItem);
router.route('/items/:id').get(getWorkspaceItem).put(updateWorkspaceItem).delete(deleteWorkspaceItem);

module.exports = router; 