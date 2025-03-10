const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

// Get all notifications for the current user
router.get('/', protect, getNotifications);

// Create a new notification
router.post('/', protect, createNotification);

// Mark a notification as read
router.patch('/:id/read', protect, markAsRead);

// Mark all notifications as read
router.patch('/read-all', protect, markAllAsRead);

// Delete a notification
router.delete('/:id', protect, deleteNotification);

module.exports = router; 