import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CollaborativeEditor from '../components/collaboration/CollaborativeEditor';
import { nanoid } from 'nanoid';
import './CollaborationPage.css';

const CollaborationPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  // Set active session from URL parameter
  useEffect(() => {
    if (sessionId) {
      setActiveSession(sessionId);
    }
  }, [sessionId]);

  // Handle joining a session
  const handleJoinSession = useCallback(async (code) => {
    try {
      setIsJoining(true);
      
      if (!code.trim()) {
        toast.error('Please enter a session code');
        return;
      }

      // In a real app, you might validate the session code on the server
      // For now, we'll just navigate to the session
      navigate(`/collaboration/${code}`);
      setActiveSession(code);
      toast.success('Joined session successfully!');
    } catch (err) {
      console.error('Error joining session:', err);
      toast.error('Failed to join session. Please check the code and try again.');
    } finally {
      setIsJoining(false);
      setJoinCode('');
    }
  }, [navigate]);

  // Handle creating a new session
  const handleCreateSession = () => {
    try {
      if (!newSessionName.trim()) {
        toast.error('Please enter a session name');
        return;
      }

      // Generate a unique session ID
      const sessionId = nanoid(10);
      
      // In a real app, you would save this session to the database
      setActiveSession(sessionId);
      navigate(`/collaboration/${sessionId}`);
      toast.success(`Created session: ${newSessionName}`);
      setShowCreateModal(false);
      setNewSessionName('');
    } catch (err) {
      console.error('Error creating session:', err);
      toast.error('Failed to create session. Please try again.');
    }
  };

  // Handle leaving the current session
  const handleLeaveSession = () => {
    setActiveSession(null);
    navigate('/collaboration');
    toast.info('Left the session');
  };

  return (
    <div className="collaboration-page">
      <div className="collaboration-header">
        <h1>Real-time Collaboration</h1>
        <p>Work together with your team in real-time</p>
      </div>

      {!activeSession ? (
        <div className="collaboration-join">
          <div className="join-options">
            <div className="join-card">
              <h2>Join Existing Session</h2>
              <p>Enter a session code to collaborate with others</p>
              <div className="join-form">
                <input
                  type="text"
                  placeholder="Enter session code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <button 
                  onClick={() => handleJoinSession(joinCode)}
                  disabled={isJoining || !joinCode.trim()}
                >
                  {isJoining ? 'Joining...' : 'Join Session'}
                </button>
              </div>
            </div>

            <div className="join-card">
              <h2>Create New Session</h2>
              <p>Start a new collaboration session</p>
              <button onClick={() => setShowCreateModal(true)}>
                Create Session
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="collaboration-workspace">
          <div className="workspace-header">
            <h2>Session: {activeSession}</h2>
            <button onClick={handleLeaveSession} className="leave-button">
              Leave Session
            </button>
          </div>
          
          <div className="editor-container">
            <CollaborativeEditor workspaceId={activeSession} />
          </div>
          
          <div className="collaboration-info">
            <p>
              Share this link with others to invite them to this session:
              <br />
              <code>{window.location.href}</code>
            </p>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Session</h2>
            <input
              type="text"
              placeholder="Session Name"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="cancel-button">
                Cancel
              </button>
              <button 
                onClick={handleCreateSession}
                disabled={!newSessionName.trim()}
                className="create-button"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationPage; 