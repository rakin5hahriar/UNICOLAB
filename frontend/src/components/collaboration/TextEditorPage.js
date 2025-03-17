import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CollaborativeTextEditor from './CollaborativeTextEditor';
import socketService from '../../services/socketService';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaUsers, FaLink } from 'react-icons/fa';
import './TextEditorPage.css';

const TextEditorPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (!workspaceId || !currentUser) {
      toast.error('Missing workspace ID or user information');
      navigate('/dashboard');
      return;
    }

    // Connect to socket and join workspace
    socketService.connect();
    socketService.joinWorkspace(workspaceId, currentUser.uid, currentUser.displayName || currentUser.email);

    // Set up event listeners
    const connectionHandler = (data) => {
      setIsConnected(data.connected);
    };

    const collaboratorsHandler = (data) => {
      setCollaborators(data.collaborators || []);
    };

    // Subscribe to events
    socketService.on('connection-change', connectionHandler);
    socketService.on('collaborators-update', collaboratorsHandler);

    // Generate share link
    const baseUrl = window.location.origin;
    setShareLink(`${baseUrl}/workspace/${workspaceId}`);

    return () => {
      // Clean up event listeners
      socketService.off('connection-change', connectionHandler);
      socketService.off('collaborators-update', collaboratorsHandler);
      
      // Leave workspace
      socketService.leaveWorkspace(workspaceId);
    };
  }, [workspaceId, currentUser, navigate]);

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        toast.success('Link copied to clipboard');
      })
      .catch((error) => {
        toast.error('Failed to copy link: ' + error.message);
      });
  };

  return (
    <div className="text-editor-page">
      <div className="text-editor-header">
        <button className="back-button" onClick={handleBackClick}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        
        <div className="connection-status">
          {isConnected ? (
            <span className="status-connected">Connected</span>
          ) : (
            <span className="status-disconnected">Offline Mode</span>
          )}
        </div>
        
        <div className="collaborators-info">
          <button className="collaborators-button" onClick={handleShareClick}>
            <FaUsers /> {collaborators.length} {collaborators.length === 1 ? 'User' : 'Users'}
          </button>
        </div>
      </div>
      
      <div className="text-editor-container">
        <CollaborativeTextEditor 
          workspaceId={workspaceId}
          userId={currentUser?.uid}
          username={currentUser?.displayName || currentUser?.email}
          readOnly={false}
        />
      </div>
      
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Share Document</h3>
            <p>Share this link with others to collaborate:</p>
            
            <div className="share-link-container">
              <input 
                type="text" 
                value={shareLink} 
                readOnly 
                onClick={(e) => e.target.select()}
              />
              <button onClick={handleCopyLink}>
                <FaLink /> Copy
              </button>
            </div>
            
            <div className="collaborators-list">
              <h4>Current Collaborators ({collaborators.length})</h4>
              {collaborators.length > 0 ? (
                <ul>
                  {collaborators.map((user) => (
                    <li key={user.id}>
                      <div 
                        className="collaborator-avatar"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No other users are currently editing this document</p>
              )}
            </div>
            
            <button className="close-button" onClick={() => setShowShareModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditorPage; 