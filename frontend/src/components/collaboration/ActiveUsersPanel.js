import React from 'react';
import './ActiveUsersPanel.css';

const ActiveUsersPanel = ({ participants = [], currentUser, isOwner, showAccessControl, onGrantAccess, onRevokeAccess }) => {
  // Generate a color based on user name
  const generateColor = (name) => {
    const colors = [
      '#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96',
      '#13c2c2', '#faad14', '#a0d911', '#f5222d', '#2f54eb'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get user initial
  const getInitial = (name) => {
    return (name || 'User').charAt(0).toUpperCase();
  };

  return (
    <div className="active-users-panel">
      <div className="panel-header">
        <h3>Active Users ({participants.length})</h3>
      </div>
      
      {participants.length === 0 ? (
        <div className="no-users">
          <p>No other users are currently active</p>
        </div>
      ) : (
        <div className="users-list">
          {participants.map((user) => {
            const isCurrentUser = user.id === currentUser?.id;
            const userColor = generateColor(user.name || user.id);
            
            return (
              <div 
                key={user.id} 
                className={`user-item ${isCurrentUser ? 'current-user' : ''}`}
              >
                <div 
                  className="user-avatar" 
                  style={{ backgroundColor: userColor }}
                >
                  {getInitial(user.name)}
                </div>
                <div className="user-info">
                  <div className="user-name">
                    {isCurrentUser ? `${user.name || 'You'} (You)` : user.name || 'Anonymous'}
                  </div>
                  {user.status && (
                    <div className="user-status">
                      {user.status}
                    </div>
                  )}
                </div>
                <div className="user-indicator">
                  <span className="status-dot online"></span>
                </div>
                
                {isOwner && !isCurrentUser && showAccessControl && (
                  <div className="user-actions">
                    {user.hasAccess ? (
                      <button 
                        className="action-btn revoke" 
                        onClick={() => onRevokeAccess(user.id)}
                        title="Revoke access"
                      >
                        <i className="fas fa-ban"></i>
                      </button>
                    ) : (
                      <button 
                        className="action-btn grant" 
                        onClick={() => onGrantAccess(user.id)}
                        title="Grant access"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveUsersPanel; 