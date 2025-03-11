const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  removeShare
} = require('../controllers/documentController');

// Routes for /api/documents
router.route('/')
  .get(protect, getDocuments)
  .post(protect, createDocument);

// Routes for /api/documents/:id
router.route('/:id')
  .get(protect, getDocumentById)
  .put(protect, updateDocument)
  .delete(protect, deleteDocument);

// Routes for sharing
router.route('/:id/share')
  .post(protect, shareDocument);

router.route('/:id/share/:userId')
  .delete(protect, removeShare);

module.exports = router; 