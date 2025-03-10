const cron = require('node-cron');
const WorkspaceItem = require('../models/WorkspaceItem');
const User = require('../models/User');
const { createReminderNotification, createDeadlineNotification } = require('../controllers/notificationController');

// Function to check for upcoming deadlines and create notifications
const checkDeadlines = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find assignments due in the next 24 hours
    const upcomingAssignments = await WorkspaceItem.find({
      type: 'assignment',
      dueDate: {
        $gte: now.toISOString().split('T')[0],
        $lte: tomorrow.toISOString().split('T')[0]
      },
      status: { $ne: 'completed' }
    }).populate('user');
    
    // Create notifications for each upcoming assignment
    for (const assignment of upcomingAssignments) {
      await createDeadlineNotification(assignment.user._id, assignment);
    }
    
    console.log(`Checked deadlines: ${upcomingAssignments.length} upcoming assignments found`);
  } catch (error) {
    console.error('Error checking deadlines:', error);
  }
};

// Function to check for reminders and create notifications
const checkReminders = async () => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Find items with reminders set for the current date and time (within the hour)
    const itemsWithReminders = await WorkspaceItem.find({
      reminderEnabled: true,
      reminderDate: currentDate,
      status: { $ne: 'completed' }
    }).populate('user');
    
    // Create notifications for each item with a reminder
    for (const item of itemsWithReminders) {
      if (!item.reminderTime) continue;
      
      const [reminderHour, reminderMinute] = item.reminderTime.split(':').map(Number);
      
      // Check if the reminder time is within the current hour
      if (reminderHour === currentHour && Math.abs(reminderMinute - currentMinute) <= 5) {
        await createReminderNotification(item.user._id, item);
      }
    }
    
    console.log(`Checked reminders: ${itemsWithReminders.length} items with reminders found`);
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

// Schedule jobs to run at specific intervals
const scheduleJobs = () => {
  // Check deadlines every 6 hours
  cron.schedule('0 */6 * * *', () => {
    console.log('Running deadline check...');
    checkDeadlines();
  });
  
  // Check reminders every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('Running reminder check...');
    checkReminders();
  });
  
  console.log('Notification scheduler initialized');
};

module.exports = { scheduleJobs }; 