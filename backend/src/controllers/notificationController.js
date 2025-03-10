const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Get all notifications for the current user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { title, message, type, relatedItem } = req.body;
    
    const notification = new Notification({
      user: req.user.id,
      title,
      message,
      type: type || 'info',
      relatedItem
    });
    
    await notification.save();
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
    
    await notification.deleteOne();
    
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

// Create a notification for assignment reminders
const createReminderNotification = async (userId, workspaceItem) => {
  try {
    const notification = new Notification({
      user: userId,
      title: 'Assignment Reminder',
      message: `Reminder: "${workspaceItem.title}" is due soon!`,
      type: 'warning',
      relatedItem: workspaceItem._id
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating reminder notification:', error);
    return null;
  }
};

// Create a notification for approaching deadlines
const createDeadlineNotification = async (userId, workspaceItem) => {
  try {
    const notification = new Notification({
      user: userId,
      title: 'Deadline Approaching',
      message: `"${workspaceItem.title}" is due in less than 24 hours!`,
      type: 'error',
      relatedItem: workspaceItem._id
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating deadline notification:', error);
    return null;
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createReminderNotification,
  createDeadlineNotification
}; 