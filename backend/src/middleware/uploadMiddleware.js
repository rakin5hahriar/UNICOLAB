const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created at:', uploadsDir);
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Double-check that the directory exists before saving
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Get original file extension and sanitize it
    const ext = path.extname(file.originalname).toLowerCase();
    // Create safe filename
    const safeFilename = uniqueSuffix + ext;
    cb(null, safeFilename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only certain file types
  const allowedFileTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  console.log('File upload attempt:', file.originalname, file.mimetype);
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log('File type rejected:', file.mimetype);
    cb(new Error('File type not supported. Please upload PDF, Word, Excel, PowerPoint, text, or image files.'), false);
  }
};

// Create multer upload instance
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  }
});

module.exports = upload; 