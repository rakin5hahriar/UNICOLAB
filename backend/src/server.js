const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const fileRoutes = require('./routes/fileRoutes');
const workspaceItemRoutes = require('./routes/workspaceItemRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { scheduleJobs } = require('./utils/notificationScheduler');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created at:', uploadsDir);
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('Serving uploads from:', uploadsDir);

// Add a route to check if a file exists
app.get('/api/check-file/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ exists: false, message: 'File not found' });
    }
    res.json({ exists: true, path: filePath });
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Student Workspace Management API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspace-items', workspaceItemRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', fileRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Error handling middleware for file uploads
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 10MB.' });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Unexpected field in file upload.' });
  }
  
  next(err);
});

// General error handling middleware
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Connect to database
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Uploads directory created');
    }
    
    // Initialize notification scheduler
    scheduleJobs();
    
    const PORT = process.env.PORT || 5000;
    
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer(); 