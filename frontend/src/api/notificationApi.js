import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get all notifications
export const getNotifications = async () => {
  try {
    const response = await axios.get(`${API_URL}/notifications`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Create a new notification
export const createNotification = async (notificationData) => {
  try {
    const response = await axios.post(`${API_URL}/notifications`, notificationData);
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Mark a notification as read
export const markAsRead = async (notificationId) => {
  try {
    const response = await axios.patch(`${API_URL}/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await axios.patch(`${API_URL}/notifications/read-all`);
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(`${API_URL}/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}; 