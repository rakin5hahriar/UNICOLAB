import React from 'react';
import { useCollaboration } from '../contexts/CollaborationContext';

const UserAvatar = ({ username }) => {
    const initials = username
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-purple-500',
        'bg-pink-500',
    ];

    const colorIndex = username
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

    return (
        <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${colors[colorIndex]}`}
            title={username}
        >
            {initials}
        </div>
    );
};

const ActiveUsers = () => {
    const context = useCollaboration();
    // Initialize activeUsers as an empty Map if it doesn't exist in the context
    const activeUsers = context.activeUsers || new Map();

    return (
        <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Users</h3>
            <div className="flex flex-col space-y-3">
                {activeUsers instanceof Map && Array.from(activeUsers.entries()).map(([userId, user]) => (
                    <div key={userId} className="flex items-center space-x-3">
                        <UserAvatar username={user.username} />
                        <span className="text-sm text-gray-600">{user.username}</span>
                    </div>
                ))}
                {(!activeUsers || !(activeUsers instanceof Map) || activeUsers.size === 0) && (
                    <div className="text-sm text-gray-500">No active users</div>
                )}
            </div>
        </div>
    );
};

export default ActiveUsers; 