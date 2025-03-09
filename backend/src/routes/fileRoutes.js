const express = require('express');
const { uploadFile, deleteFile } = require('../controllers/fileController');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Upload file route with error handling
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Error in file upload middleware:', err);
      return res.status(400).json({ message: err.message });
    }
    // No error, proceed to controller
    uploadFile(req, res, next);
  });
});

// Delete file route
router.delete('/:filename', deleteFile);

module.exports = router; 