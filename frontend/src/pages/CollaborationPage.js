import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import CollaborativeWorkspace from '../components/collaboration/CollaborativeWorkspace';
import { useAuth } from '../contexts/AuthContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import './CollaborationPage.css';

const CollaborationPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    joinWorkspace, 
    leaveWorkspace, 
    currentWorkspace, 
    isConnected, 
    isLoading, 
    error,
    getConnectionStatus 
  } = useCollaboration();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [userName, setUserName] = useState(user?.name || '');
  const [joinSessionId, setJoinSessionId] = useState(sessionId || '');
  const [activeSession, setActiveSession] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});

  // If sessionId is provided in URL, try to join it automatically
  useEffect(() => {
    if (sessionId && !activeSession && !isJoining) {
      handleJoinSession(sessionId);
    }
  }, [sessionId, activeSession, isJoining]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (activeSession) {
        try {
          console.log('Component unmounting, leaving workspace:', activeSession.id);
          leaveWorkspace();
        } catch (error) {
          console.error('Error leaving workspace during cleanup:', error);
        }
      }
    };
  }, [activeSession, leaveWorkspace]);

  // Periodically check connection status
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (getConnectionStatus) {
        setConnectionStatus(getConnectionStatus());
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [getConnectionStatus]);

  const handleCreateSession = () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    const newSessionId = uuidv4();
    setIsJoining(true);

    try {
      const success = joinWorkspace(newSessionId, userName || 'Anonymous');
      
      if (success) {
        setActiveSession({
          id: newSessionId,
          name: sessionName,
          createdBy: user?.id || 'anonymous',
          createdAt: new Date().toISOString()
        });
        
        // Update URL without reloading the page
        navigate(`/collaboration/${newSessionId}`, { replace: true });
        toast.success('Collaboration session created successfully!');
      } else {
        toast.error('Failed to create collaboration session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(`Failed to create collaboration session: ${error.message}`);
    } finally {
      setShowCreateModal(false);
      setIsJoining(false);
    }
  };

  const handleJoinSession = (sessionIdToJoin = joinSessionId) => {
    if (!sessionIdToJoin.trim()) {
      toast.error('Please enter a session ID');
      return;
    }

    setIsJoining(true);

    try {
      const success = joinWorkspace(sessionIdToJoin, userName || 'Anonymous');
      
      if (success) {
        setActiveSession({
          id: sessionIdToJoin,
          name: `Session ${sessionIdToJoin.substring(0, 8)}`,
          joinedAt: new Date().toISOString()
        });
        
        // Update URL without reloading the page
        navigate(`/collaboration/${sessionIdToJoin}`, { replace: true });
        toast.success('Joined collaboration session successfully!');
      } else {
        toast.error('Failed to join collaboration session');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error(`Failed to join collaboration session: ${error.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveSession = () => {
    try {
      console.log('Leaving session:', activeSession?.id);
      const success = leaveWorkspace();
      
      if (success) {
        console.log('Successfully left workspace');
      } else {
        console.warn('Failed to leave workspace, but continuing with UI updates');
      }
      
      // Update UI state regardless of success
      setActiveSession(null);
      navigate('/collaboration', { replace: true });
      toast.info('Left collaboration session');
    } catch (error) {
      console.error('Error leaving session:', error);
      
      // Update UI state anyway
      setActiveSession(null);
      navigate('/collaboration', { replace: true });
      toast.warning('Error leaving session, but navigation completed');
    }
  };

  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="connection-status error">
          <span>⚠️ Offline Mode</span>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry Connection
          </button>
        </div>
      );
    }
    
    if (Object.keys(connectionStatus).length > 0) {
      return (
        <div className="connection-status connected">
          <span>✓ Connected to server</span>
        </div>
      );
    }
    
    return null;
  };

  if (activeSession) {
    return (
      <div className="collaboration-page">
        <div className="collaboration-workspace-container">
          <div className="workspace-header">
            <h2>{activeSession.name}</h2>
            <div className="workspace-controls">
              {renderConnectionStatus()}
              <button className="leave-button" onClick={handleLeaveSession}>
                Leave Session
              </button>
            </div>
          </div>
          <div className="workspace-container">
            {isLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Connecting to collaboration session...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p className="error-message">{error}</p>
                <p>You can still use the whiteboard in offline mode.</p>
              </div>
            ) : (
              <CollaborativeWorkspace 
                sessionId={activeSession.id} 
                user={user || { id: 'anonymous', name: userName || 'Anonymous' }}
              />
            )}
          </div>
        </div>
        <div className="collaboration-info">
          <p>Share this session ID with others to collaborate:</p>
          <div className="session-id-container">
            <code>{activeSession.id}</code>
            <button 
              className="copy-button"
              onClick={() => {
                navigator.clipboard.writeText(activeSession.id);
                toast.info('Session ID copied to clipboard');
              }}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="collaboration-page">
      <div className="collaboration-header">
        <h1>Real-time Collaboration</h1>
        <p>Create a new session or join an existing one to collaborate in real-time</p>
        {renderConnectionStatus()}
      </div>

      <div className="collaboration-join">
        <div className="join-options">
          <div className="join-card">
            <h2>Create New Session</h2>
            <p>Start a new collaboration session and invite others to join</p>
            <button onClick={() => setShowCreateModal(true)} disabled={isJoining}>
              Create Session
            </button>
          </div>

          <div className="join-card">
            <h2>Join Existing Session</h2>
            <p>Enter a session ID to join an existing collaboration</p>
            <div className="join-form">
              {!user && (
                <input
                  type="text"
                  placeholder="Your Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={isJoining}
                />
              )}
              <input
                type="text"
                placeholder="Session ID"
                value={joinSessionId}
                onChange={(e) => setJoinSessionId(e.target.value)}
                disabled={isJoining}
              />
              <button onClick={() => handleJoinSession()} disabled={isJoining || !joinSessionId.trim()}>
                {isJoining ? 'Joining...' : 'Join Session'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Session</h2>
            {!user && (
              <input
                type="text"
                placeholder="Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            )}
            <input
              type="text"
              placeholder="Session Name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                className="create-button"
                onClick={handleCreateSession}
                disabled={!sessionName.trim() || isJoining}
              >
                {isJoining ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationPage; 