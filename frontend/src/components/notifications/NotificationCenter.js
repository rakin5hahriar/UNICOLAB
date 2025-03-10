import React, { useContext, useState } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import { FaBell, FaCheck, FaTrash, FaCheckDouble } from 'react-icons/fa';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useContext(NotificationContext);
  const navigate = useNavigate();

  const toggleNotificationPanel = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to related item if available
    if (notification.relatedItem) {
      navigate(`/workspace-items/${notification.relatedItem}`);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <span className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-500 rounded-full">✓</span>;
      case 'warning':
        return <span className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-500 rounded-full">⚠</span>;
      case 'error':
        return <span className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-500 rounded-full">!</span>;
      default:
        return <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-500 rounded-full">i</span>;
    }
  };

  return (
    <div className="relative">
      <button 
        className="relative p-1 text-gray-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
        onClick={toggleNotificationPanel}
        aria-label="Notifications"
      >
        <FaBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {notifications.length > 0 && (
                <button 
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                  onClick={markAllAsRead}
                >
                  <FaCheckDouble className="mr-1" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0 flex">
                        {!notification.isRead && (
                          <button 
                            className="mr-2 text-green-500 hover:text-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            title="Mark as read"
                          >
                            <FaCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          className="text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          title="Delete notification"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 