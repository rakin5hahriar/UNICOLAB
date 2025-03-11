import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import collaborationService from '../services/collaborationService';
import { toast } from 'react-toastify';
import './DocumentEditor.css';

// Safe check for browser environment
const isBrowser = typeof window !== 'undefined';

const DocumentEditor = ({ document, onContentChange }) => {
  const { user } = useContext(AuthContext);
  const { documentId } = useParams();
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected', 'syncing', 'offline'
  const [activeUsers, setActiveUsers] = useState([]);
  const [version, setVersion] = useState(1);
  const editorRef = useRef(null);
  const isInitialLoad = useRef(true);
  const isLocalChange = useRef(false);

  // Initialize document content
  useEffect(() => {
    if (document) {
      setContent(document?.content || '');
      setVersion(document?.version || 1);
      isInitialLoad.current = false;
    }
  }, [document]);

  // Setup collaboration service
  useEffect(() => {
    if (!documentId || !user) return;
    
    // Connect to the collaboration service
    collaborationService.connect();
    
    // Join the document
    collaborationService.joinDocument(documentId, user?._id, user?.name || 'Anonymous');
    
    // Set up callbacks for real-time collaboration
    collaborationService.setCallbacks({
      onUserJoined: (data) => {
        console.log('User joined:', data);
        setActiveUsers(data?.activeUsers || []);
        toast.info(`${data?.username || 'A user'} joined the document`);
      },
      
      onUserLeft: (data) => {
        console.log('User left:', data);
        setActiveUsers(prev => prev.filter(u => u?.id !== data?.userId));
        toast.info(`A user left the document`);
      },
      
      onContentUpdated: (data) => {
        console.log('Content updated:', data);
        // Only apply changes from others, not our own
        if (user && data?.userId !== user?._id) {
          isLocalChange.current = true;
          setContent(data?.delta?.content || '');
          setVersion(data?.version || 1);
          isLocalChange.current = false;
        }
      },
      
      onCursorMoved: (data) => {
        console.log('Cursor moved:', data);
        // We could highlight other users' cursors here
        // but that's more complex in a rich text editor
      },
      
      onDocumentState: (data) => {
        console.log('Document state received:', data);
        isLocalChange.current = true;
        setContent(data?.content || '');
        setVersion(data?.version || 1);
        isLocalChange.current = false;
      },
      
      onSyncRequired: (data) => {
        console.log('Sync required:', data);
        setConnectionStatus('syncing');
        isLocalChange.current = true;
        setContent(data?.content || '');
        setVersion(data?.version || 1);
        isLocalChange.current = false;
        setConnectionStatus('connected');
        toast.info('Document synchronized with server');
      },
      
      onError: (data) => {
        console.error('Collaboration error:', data);
        toast.error(data?.message || 'Error in collaboration');
      }
    });
    
    // Send periodic activity updates
    const activityInterval = setInterval(() => {
      if (user) {
        collaborationService.sendUserActivity();
      }
    }, 30000);
    
    // Cleanup on unmount
    return () => {
      collaborationService.leaveDocument();
      clearInterval(activityInterval);
    };
  }, [documentId, user]);

  // Monitor socket connection status
  useEffect(() => {
    const socket = collaborationService.socket;
    
    if (!socket) {
      setConnectionStatus('offline');
      return;
    }

    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('offline');
    const handleSyncing = () => setConnectionStatus('syncing');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('sync-required', handleSyncing);
    socket.on('document-state', () => setConnectionStatus('connected'));

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('sync-required', handleSyncing);
      socket.off('document-state');
    };
  }, []);

  // Auto-save changes
  useEffect(() => {
    if (isInitialLoad.current || isLocalChange.current) return;
    
    setIsEditing(true);
    
    // Debounce save operation
    const saveTimer = setTimeout(() => {
      handleSave();
    }, 2000);
    
    return () => clearTimeout(saveTimer);
  }, [content]);

  const handleEditorChange = (newContent) => {
    try {
      if (isLocalChange.current) return;
      
      console.log('DocumentEditor: Content changed', { 
        oldLength: content?.length || 0, 
        newLength: newContent?.length || 0 
      });
      
      setContent(newContent || '');
    } catch (error) {
      console.error('Error in handleEditorChange:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Save to parent component
      if (onContentChange) {
        onContentChange(content);
      }
      
      // Send changes to collaboration service
      if (documentId && user) {
        collaborationService.updateContent(
          { content },
          version
        );
      }
      
      setLastSaved(new Date());
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving document:', err);
    }
  };

  // Handle cursor position updates
  const handleCursorChange = (position, selection) => {
    if (!documentId || !user) return;
    
    collaborationService.updateCursorPosition(position, selection);
  };

  // Generate user avatar with color
  const renderUserAvatar = (user) => {
    if (!user) return null;
    
    return (
      <div 
        key={user.id || Math.random()} 
        className="user-avatar" 
        title={user.username || 'Anonymous'}
        style={{ backgroundColor: user.color || '#e0e0e0' }}
      >
        {(user.username?.[0] || 'A').toUpperCase()}
      </div>
    );
  };

  // Get status indicator class
  const getStatusIndicatorClass = () => {
    switch (connectionStatus) {
      case 'offline':
        return 'offline';
      case 'syncing':
        return 'syncing';
      default:
        return '';
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'offline':
        return 'Offline';
      case 'syncing':
        return 'Syncing...';
      default:
        return isEditing ? 'Editing...' : `Last saved: ${lastSaved.toLocaleTimeString()}`;
    }
  };

  // Render the editor
  const renderEditor = () => {
    // If not in a browser environment, render a placeholder
    if (!isBrowser) {
      return <div className="editor-placeholder">Editor loading...</div>;
    }
    
    // Log current content state
    console.log('Rendering editor with content length:', content?.length || 0);
    
    // Simple rich text editor
    return (
      <div 
        className="rich-text-editor"
        ref={editorRef}
      >
        <div className="editor-toolbar">
          <button onClick={() => document.execCommand('bold')}>Bold</button>
          <button onClick={() => document.execCommand('italic')}>Italic</button>
          <button onClick={() => document.execCommand('underline')}>Underline</button>
          <button onClick={() => document.execCommand('formatBlock', false, 'h1')}>H1</button>
          <button onClick={() => document.execCommand('formatBlock', false, 'h2')}>H2</button>
          <button onClick={() => document.execCommand('formatBlock', false, 'p')}>Paragraph</button>
          <button onClick={() => document.execCommand('insertUnorderedList')}>Bullet List</button>
          <button onClick={() => document.execCommand('insertOrderedList')}>Number List</button>
        </div>
        <div
          className="editor-content"
          contentEditable={true}
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={(e) => handleEditorChange(e.currentTarget.innerHTML)}
          onBlur={() => handleSave()}
          onKeyUp={(e) => {
            const selection = window.getSelection();
            if (selection) {
              const position = selection.anchorOffset;
              const range = selection.getRangeAt(0);
              handleCursorChange(position, {
                start: range.startOffset,
                end: range.endOffset
              });
            }
          }}
          style={{
            minHeight: '300px',
            border: '1px solid #ddd',
            padding: '10px',
            borderRadius: '4px',
            outline: 'none'
          }}
        />
      </div>
    );
  };

  return (
    <div className="document-editor">
      <div className="editor-header">
        <div className="document-info">
          <h2>{document?.name || 'Untitled Document'}</h2>
          <div className="collaboration-status">
            <div className={`status-indicator ${getStatusIndicatorClass()}`}></div>
            <span>{getStatusText()}</span>
          </div>
        </div>
        <div className="active-users">
          {activeUsers && activeUsers.map(user => renderUserAvatar(user))}
        </div>
      </div>

      {renderEditor()}
    </div>
  );
};

export default DocumentEditor; 