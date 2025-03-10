import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import { toast } from 'react-toastify';
import './CollaborationPage.css';

const CollaborationPage = () => {
  const { user } = useContext(AuthContext);
  const { sessionId } = useParams();
  const [joinCode, setJoinCode] = useState(sessionId || '');
  const [sessionName, setSessionName] = useState('');
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [newDocName, setNewDocName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('view'); // 'view' or 'edit'
  
  const {
    activeSession,
    participants,
    messages,
    createSession,
    joinSession,
    leaveSession
  } = useCollaboration();

  useEffect(() => {
    // If there's a sessionId in the URL, join that session
    if (sessionId) {
      handleJoinSession(sessionId);
    }
    
    // Cleanup: leave session when component unmounts
    return () => {
      if (activeSession) {
        leaveSession();
      }
    };
  }, [sessionId]);

  // Fetch user's documents (owned + shared with them)
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      // TODO: Implement API call to fetch documents
      // For now using mock data
      setDocuments([
        { id: 1, name: 'Project Proposal', owner: user.email, shared: [] },
        { id: 2, name: 'Meeting Notes', owner: 'colleague@example.com', shared: [{ email: user.email, access: 'edit' }] }
      ]);
    } catch (err) {
      toast.error('Failed to fetch documents');
    }
  };

  const handleCreateSession = async () => {
    try {
      if (!sessionName.trim()) {
        toast.error('Please enter a session name');
        return;
      }

      const session = await createSession({
        name: sessionName,
        description: `Collaboration session created by ${user.name}`,
        createdBy: user.id
      });

      if (session) {
        toast.success('Session created successfully!');
        setSessionName('');
        // The session code will be shown to the user
        toast.info(`Share this code with others: ${session.code}`);
      }
    } catch (err) {
      console.error('Error creating session:', err);
      toast.error('Failed to create session. Please try again.');
    }
  };

  const handleJoinSession = async (code) => {
    try {
      if (!code.trim()) {
        toast.error('Please enter a session code');
        return;
      }

      await joinSession(code);
      toast.success('Joined session successfully!');
      setJoinCode('');
    } catch (err) {
      console.error('Error joining session:', err);
      toast.error('Failed to join session. Please check the code and try again.');
    }
  };

  const handleCreateDocument = async () => {
    try {
      if (!newDocName.trim()) {
        toast.error('Please enter a document name');
        return;
      }
      // TODO: Implement API call to create document
      const newDoc = {
        id: Date.now(),
        name: newDocName,
        owner: user.email,
        shared: []
      };
      setDocuments([...documents, newDoc]);
      setNewDocName('');
      setShowNewDocModal(false);
      toast.success('Document created successfully!');
    } catch (err) {
      toast.error('Failed to create document');
    }
  };

  const handleShareDocument = async () => {
    try {
      if (!shareEmail.trim()) {
        toast.error('Please enter an email address');
        return;
      }
      // TODO: Implement API call to share document
      const updatedDocs = documents.map(doc => {
        if (doc.id === selectedDoc.id) {
          return {
            ...doc,
            shared: [...doc.shared, { email: shareEmail, access: accessLevel }]
          };
        }
        return doc;
      });
      setDocuments(updatedDocs);
      setShareEmail('');
      setShowShareModal(false);
      toast.success(`Document shared with ${shareEmail}`);
    } catch (err) {
      toast.error('Failed to share document');
    }
  };

  return (
    <div className="collaboration-page">
      <div className="collaboration-header">
        <h1>Real-time Collaboration</h1>
        <p>Work together with your peers in real-time</p>
      </div>

      <div className="collaboration-content">
        {activeSession ? (
          // Active Session View
          <div className="active-session-container">
            <div className="session-info">
              <h2>{activeSession.name}</h2>
              <div className="participant-list">
                <h3>Participants ({participants.length})</h3>
                <ul>
                  {participants.map((participant) => (
                    <li key={participant.id}>
                      {participant.username}
                      {participant.id === activeSession.createdBy && ' (Host)'}
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={leaveSession}
                className="leave-button"
              >
                Leave Session
              </button>
            </div>

            <div className="collaboration-workspace">
              {/* Add your collaborative workspace components here */}
              <div className="workspace-placeholder">
                <h3>Collaborative Workspace</h3>
                <p>This is where your collaborative tools will appear</p>
              </div>
            </div>
          </div>
        ) : (
          // Session Join/Create View
          <div className="collaboration-actions">
            <div className="join-session">
              <h2>Join Existing Session</h2>
              <div className="join-form">
                <input
                  type="text"
                  placeholder="Enter session code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="join-input"
                />
                <button 
                  onClick={() => handleJoinSession(joinCode)}
                  className="join-button"
                >
                  Join Session
                </button>
              </div>
            </div>

            <div className="create-session">
              <h2>Create New Session</h2>
              <p>Start a new collaboration session and invite others</p>
              <input
                type="text"
                placeholder="Enter session name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="session-name-input"
              />
              <button 
                onClick={handleCreateSession}
                className="create-button"
              >
                Create Session
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="documents-list">
        <h2>Your Documents</h2>
        {documents.map(doc => (
          <div key={doc.id} className="document-item">
            <div className="document-info">
              <h3>{doc.name}</h3>
              <p>Owner: {doc.owner}</p>
              {doc.shared.length > 0 && (
                <p>Shared with: {doc.shared.map(s => s.email).join(', ')}</p>
              )}
            </div>
            <div className="document-actions">
              <button 
                className="edit-button"
                onClick={() => {/* TODO: Implement document editing */}}
              >
                Open
              </button>
              {doc.owner === user.email && (
                <button 
                  className="share-button"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setShowShareModal(true);
                  }}
                >
                  Share
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Document</h2>
            <input
              type="text"
              placeholder="Document name"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => setShowNewDocModal(false)}>Cancel</button>
              <button onClick={handleCreateDocument}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Share Document</h2>
            <input
              type="email"
              placeholder="Enter email address"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
            />
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
            >
              <option value="view">Can view</option>
              <option value="edit">Can edit</option>
            </select>
            <div className="modal-actions">
              <button onClick={() => setShowShareModal(false)}>Cancel</button>
              <button onClick={handleShareDocument}>Share</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationPage; 