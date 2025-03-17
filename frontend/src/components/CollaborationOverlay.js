import React from 'react';
import { useCollaboration } from '../contexts/CollaborationContext';

const CursorOverlay = ({ userId, position, username }) => {
    const cursorStyle = {
        position: 'absolute',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 1000,
    };

    const labelStyle = {
        backgroundColor: '#4a5568',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '12px',
        marginTop: '-20px',
        whiteSpace: 'nowrap',
    };

    return (
        <div style={cursorStyle}>
            <div style={labelStyle}>{username}</div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 1l7 14 2-6 6-2L1 1z" stroke="#4a5568" strokeWidth="1.5" fill="white"/>
            </svg>
        </div>
    );
};

const CollaborationOverlay = ({ workspaceId }) => {
    const context = useCollaboration();
    
    // If context is not available, render nothing
    if (!context) return null;
    
    // Safely get activeUsers and cursorPositions from context
    const { activeUsers, cursorPositions, offlineMode } = context;
    
    // If we're in offline mode, don't show cursors
    if (offlineMode) return null;

    // Safely get entries from activeUsers
    const getActiveUserEntries = () => {
        try {
            if (!activeUsers || !(activeUsers instanceof Map)) return [];
            return Array.from(activeUsers.entries());
        } catch (error) {
            console.error('Error getting activeUsers entries:', error);
            return [];
        }
    };

    // Safely get cursor position
    const getCursorPosition = (userId) => {
        try {
            if (!cursorPositions || !(cursorPositions instanceof Map)) return null;
            return cursorPositions.get(userId);
        } catch (error) {
            console.error('Error getting cursor position:', error);
            return null;
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none">
            {getActiveUserEntries().map(([userId, user]) => {
                if (!user) return null;
                
                const position = getCursorPosition(userId);
                if (!position) return null;
                
                return (
                    <CursorOverlay
                        key={userId}
                        userId={userId}
                        position={position}
                        username={user.username || 'Anonymous'}
                    />
                );
            })}
        </div>
    );
};

export default CollaborationOverlay; 