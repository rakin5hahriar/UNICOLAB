import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Whiteboard from './Whiteboard';
import CollaborativeTextEditor from './CollaborativeTextEditor';
import VideoCall from './VideoCall';
import ChatPanel from './ChatPanel';
import ActiveUsersPanel from './ActiveUsersPanel';
import { useCollaboration } from '../../contexts/CollaborationContext';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';
import './CollaborativeWorkspace.css';

const CollaborativeWorkspace = ({ sessionId, user }) => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const effectiveWorkspaceId = sessionId || workspaceId;
  
  const [showVideo, setShowVideo] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showUsers, setShowUsers] = useState(true);
  const [accessControl, setAccessControl] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [activeTab, setActiveTab] = useState('whiteboard'); // 'whiteboard' or 'textEditor'
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const connectionInitialized = useRef(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  
  const { 
    participants, 
    hasAccess, 
    isConnected: collaborationIsConnected,
    error: collaborationError,
    getConnectionStatus
  } = useCollaboration();

  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Extract user ID and name safely
  const userId = user?._id || user?.id || 'guest-' + Math.random().toString(36).substr(2, 9);
  const username = user?.name || user?.username || 'Guest User';

  // Check if the current user is the owner (first user to join)
  useEffect(() => {
    if (participants.length > 0) {
      // The first user to join is considered the owner
      const firstUser = participants[0];
      setIsOwner(firstUser && firstUser.id === (user?._id || user?.id));
    }
  }, [participants, user]);

  // Periodically check connection status
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (getConnectionStatus) {
        setConnectionStatus(getConnectionStatus());
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [getConnectionStatus]);

  // Initialize socket connection
  useEffect(() => {
    // If no user or workspace ID, don't initialize
    if (!user || !effectiveWorkspaceId) {
      return;
    }

    if (!effectiveWorkspaceId || !userId || !username) {
      setError('Missing required information. Please check your login status.');
      setIsLoading(false);
      return;
    }

    console.log('Initializing socket connection for workspace:', effectiveWorkspaceId);
    console.log('User ID:', userId);
    console.log('Username:', username);
    
    // Connect to socket server
    socketService.connect();
    
    // Set up connection status handler
    const handleConnectionChange = (status) => {
      console.log('Workspace: Connection status changed:', status);
      setIsConnected(status.connected);
      
      if (status.connected && !connectionInitialized.current) {
        // Join the workspace when connected
        console.log('Joining workspace:', effectiveWorkspaceId);
        const joinResult = socketService.joinWorkspace(effectiveWorkspaceId, userId, username);
        console.log('Join workspace result:', joinResult);
        connectionInitialized.current = true;
        setIsLoading(false);
      }
    };
    
    // Register connection event handler
    const unsubscribeConnection = socketService.on('connection-change', handleConnectionChange);
    
    // Check connection status immediately
    const currentStatus = socketService.getStatus();
    console.log('Current socket status:', currentStatus);
    
    // If already connected, join workspace immediately
    if (currentStatus.connected && !connectionInitialized.current) {
      console.log('Socket already connected, joining workspace immediately');
      const joinResult = socketService.joinWorkspace(effectiveWorkspaceId, userId, username);
      console.log('Join workspace result:', joinResult);
      connectionInitialized.current = true;
      setIsLoading(false);
    }

    return () => {
      unsubscribeConnection();
    };
  }, [effectiveWorkspaceId, userId, username, user]);

  // Handle chat messages
  useEffect(() => {
    if (!socketService.isSocketConnected()) return;

    const handleChatMessage = (data) => {
      const newMessage = {
        id: data.id || Date.now().toString(),
        content: data.content,
        sender: data.userId,
        senderName: data.username,
        timestamp: data.timestamp || new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Increment unread count if chat is minimized or not shown
      if (chatMinimized || !showChat) {
        setUnreadMessages(prev => prev + 1);
      }
    };

    const handleSystemMessage = (data) => {
      const newMessage = {
        id: Date.now().toString(),
        content: data.content,
        type: 'system',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);
    };

    // Subscribe to chat events
    const unsubscribeChatMessage = socketService.on('chat-message', handleChatMessage);
    const unsubscribeUserJoined = socketService.on('user-joined', (data) => {
      handleSystemMessage({ content: `${data.username} joined the workspace` });
    });
    const unsubscribeUserLeft = socketService.on('user-left', (data) => {
      handleSystemMessage({ content: `${data.username} left the workspace` });
    });

    return () => {
      unsubscribeChatMessage();
      unsubscribeUserJoined();
      unsubscribeUserLeft();
    };
  }, [chatMinimized, showChat]);

  // Send chat message
  const handleSendMessage = (content) => {
    if (!socketService.isSocketConnected()) {
      toast.error('Cannot send message while offline');
      return;
    }

    const messageData = {
      content,
      userId,
      username,
      workspaceId: effectiveWorkspaceId
    };

    socketService.sendChatMessage(messageData);
  };

  // Toggle video call visibility
  const toggleVideo = () => {
    setShowVideo(!showVideo);
  };

  // Toggle chat panel visibility
  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setChatMinimized(false);
      setUnreadMessages(0);
    }
  };

  // Toggle chat minimized state
  const toggleChatMinimized = () => {
    setChatMinimized(!chatMinimized);
    if (!chatMinimized) {
      setUnreadMessages(0);
    }
  };

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Toggle active users panel visibility
  const toggleUsers = () => {
    setShowUsers(!showUsers);
  };

  // Toggle access control panel visibility
  const toggleAccessControl = () => {
    setAccessControl(!accessControl);
  };

  // Switch between whiteboard and text editor
  const switchToWhiteboard = () => {
    setActiveTab('whiteboard');
  };

  const switchToTextEditor = () => {
    setActiveTab('textEditor');
  };

  // Grant access to a user
  const grantAccess = (userId) => {
    if (isOwner && collaborationIsConnected) {
      socketService.grantAccess(userId);
      toast.success(`Access granted to user`);
    }
  };

  // Revoke access from a user
  const revokeAccess = (userId) => {
    if (isOwner && collaborationIsConnected) {
      socketService.revokeAccess(userId);
      toast.info(`Access revoked from user`);
    }
  };

  // If no user or workspace ID, show loading
  if (!user || !effectiveWorkspaceId) {
    return <div className="loading">Loading user or workspace information...</div>;
  }

  if (isLoading) {
    return (
      <div className="collaborative-workspace loading">
        <div className="loading-spinner"></div>
        <p>Connecting to workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collaborative-workspace error">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/workspaces')}>Return to Workspaces</button>
        </div>
      </div>
    );
  }

  // If no access, show access denied message
  if (!hasAccess) {
    return (
      <div className="collaborative-workspace access-denied">
        <h3>Access Denied</h3>
        <p>You do not have access to this workspace.</p>
        <p>Please contact the workspace owner to request access.</p>
      </div>
    );
  }

  // Render the collaborative workspace
  return (
    <div className="collaborative-workspace">
      <div className="workspace-header">
        <div className="workspace-info">
          <h2>Workspace: {effectiveWorkspaceId}</h2>
          <div className="connection-status">
            {isConnected ? (
              <span className="status connected">Connected</span>
            ) : (
              <span className="status disconnected">Offline Mode</span>
            )}
          </div>
        </div>
        
        <div className="workspace-tabs">
          <button
            className={`tab-button ${activeTab === 'whiteboard' ? 'active' : ''}`}
            onClick={switchToWhiteboard}
          >
            <i className="fas fa-paint-brush"></i>
            Whiteboard
          </button>
          <button
            className={`tab-button ${activeTab === 'textEditor' ? 'active' : ''}`}
            onClick={switchToTextEditor}
          >
            <i className="fas fa-file-alt"></i>
            Text Editor
          </button>
        </div>
        
        <div className="workspace-actions">
          <button
            className={`action-button ${showVideo ? 'active' : ''}`}
            onClick={toggleVideo}
            title="Toggle Video Call"
          >
            <i className={`fas ${showVideo ? 'fa-video-slash' : 'fa-video'}`}></i>
          </button>
          <button
            className={`action-button ${showChat ? 'active' : ''}`}
            onClick={toggleChat}
            title="Toggle Chat"
          >
            <i className="fas fa-comments"></i>
            {unreadMessages > 0 && <span className="notification-badge">{unreadMessages}</span>}
          </button>
          <button
            className={`action-button ${showUsers ? 'active' : ''}`}
            onClick={toggleUsers}
            title="Toggle Users Panel"
          >
            <i className="fas fa-users"></i>
          </button>
          <button
            className="action-button"
            onClick={() => navigate('/workspaces')}
            title="Back to Workspaces"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        </div>
      </div>
      
      <div className="workspace-content">
        <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {showVideo && (
            <div className="video-container">
              <div className="section-header">
                <h3>Video Call</h3>
                <button className="minimize-button" onClick={toggleVideo}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <VideoCall 
                workspaceId={effectiveWorkspaceId} 
                userId={userId} 
                username={username}
              />
            </div>
          )}

          <div className="collaboration-tool-section">
            {activeTab === 'whiteboard' ? (
              <Whiteboard 
                workspaceId={effectiveWorkspaceId} 
                userId={userId} 
                username={username}
                readOnly={!hasAccess}
              />
            ) : (
              <CollaborativeTextEditor
                workspaceId={effectiveWorkspaceId}
                userId={userId}
                username={username}
                readOnly={!hasAccess}
              />
            )}
          </div>
        </div>

        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <i className={`fas ${sidebarCollapsed ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
          
          {showUsers && (
            <div className="sidebar-section users-section">
              <div className="section-header">
                <h3>Participants ({participants.length})</h3>
                <button className="minimize-button" onClick={toggleUsers}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <ActiveUsersPanel 
                participants={participants} 
                currentUser={user}
                isOwner={isOwner}
                showAccessControl={accessControl}
                onGrantAccess={grantAccess}
                onRevokeAccess={revokeAccess}
              />
            </div>
          )}
          
          {showChat && (
            <div className={`sidebar-section chat-section ${chatMinimized ? 'minimized' : ''}`}>
              <div className="section-header">
                <h3>Chat {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}</h3>
                <div className="section-controls">
                  <button className="minimize-button" onClick={toggleChatMinimized}>
                    <i className={`fas ${chatMinimized ? 'fa-expand-alt' : 'fa-compress-alt'}`}></i>
                  </button>
                  <button className="close-button" onClick={toggleChat}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
              {!chatMinimized && (
                <ChatPanel 
                  messages={messages} 
                  onSendMessage={handleSendMessage}
                  currentUser={user}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborativeWorkspace; 