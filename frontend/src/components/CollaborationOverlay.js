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
    const { activeUsers, cursorPositions } = useCollaboration();

    return (
        <div className="fixed inset-0 pointer-events-none">
            {Array.from(activeUsers.entries()).map(([userId, user]) => {
                const position = cursorPositions.get(userId);
                if (!position) return null;
                
                return (
                    <CursorOverlay
                        key={userId}
                        userId={userId}
                        position={position}
                        username={user.username}
                    />
                );
            })}
        </div>
    );
};

export default CollaborationOverlay; 