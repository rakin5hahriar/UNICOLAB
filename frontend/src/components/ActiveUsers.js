import React from 'react';
import { useCollaboration } from '../contexts/CollaborationContext';

const UserAvatar = ({ username }) => {
    const initials = username
        ? username
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'U';

    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-purple-500',
        'bg-pink-500',
    ];

    const colorIndex = username
        ? username
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
        : 0;

    return (
        <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${colors[colorIndex]}`}
            title={username || 'Unknown User'}
        >
            {initials}
        </div>
    );
};

const ActiveUsers = () => {
    const { activeUsers, offlineMode } = useCollaboration();

    // If we're in offline mode, show a special message
    if (offlineMode) {
        return (
            <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Offline Mode</h3>
                <div className="flex flex-col space-y-3">
                    <div className="text-sm text-gray-500">Working offline</div>
                </div>
            </div>
        );
    }

    // Safely get entries from activeUsers
    const getActiveUserEntries = () => {
        if (!activeUsers) return [];
        if (!(activeUsers instanceof Map)) return [];
        try {
            return Array.from(activeUsers.entries());
        } catch (error) {
            console.error('Error getting activeUsers entries:', error);
            return [];
        }
    };

    const userEntries = getActiveUserEntries();

    return (
        <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Users</h3>
            <div className="flex flex-col space-y-3">
                {userEntries.length > 0 ? (
                    userEntries.map(([userId, user]) => (
                        <div key={userId} className="flex items-center space-x-3">
                            <UserAvatar username={user?.username || 'Anonymous'} />
                            <span className="text-sm text-gray-600">{user?.username || 'Anonymous'}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-gray-500">No active users</div>
                )}
            </div>
        </div>
    );
};

export default ActiveUsers; 