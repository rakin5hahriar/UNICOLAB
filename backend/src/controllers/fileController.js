const path = require('path');
const fs = require('fs');

// @desc    Upload a file
// @route   POST /api/upload
// @access  Private
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      console.log('No file received in the request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File uploaded successfully:', req.file);

    // Create file URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Return file information
    res.status(200).json({
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      fileType: req.file.mimetype,
      size: req.file.size,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error in uploadFile controller:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a file
// @route   DELETE /api/upload/:filename
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads', filename);

    console.log('Attempting to delete file:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found for deletion:', filePath);
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file
    fs.unlinkSync(filePath);
    console.log('File deleted successfully:', filePath);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error in deleteFile controller:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadFile,
  deleteFile
}; 