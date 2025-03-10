const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  uploadUrl: process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000/uploads',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
};

export default config; 