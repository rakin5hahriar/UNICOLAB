import React, { useState, useEffect, useRef } from 'react';
import collaborationService from '../services/collaborationService';
import documentService from '../services/documentService';
import authService from '../services/authService';

const UltraSimpleEditor = ({ document, onContentChange }) => {
  const [text, setText] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [version, setVersion] = useState(1);
  const [activeUsers, setActiveUsers] = useState([]);
  const textAreaRef = useRef(null);
  const isInitialLoad = useRef(true);
  const isLocalChange = useRef(false);
  const saveTimeoutRef = useRef(null);
  
  // Initialize document content
  useEffect(() => {
    if (document) {
      setText(document?.content || '');
      setVersion(document?.version || 1);
      isInitialLoad.current = false;
    }
  }, [document]);
  
  // Setup collaboration service
  useEffect(() => {
    if (!document || !document?._id) return;
    
    const user = authService.getCurrentUser();
    if (!user) return;
    
    // Connect to the collaboration service
    collaborationService.connect();
    
    // Join the document
    collaborationService.joinDocument(
      document._id, 
      user?._id || 'anonymous', 
      user?.name || user?.email || 'Anonymous'
    );
    
    // Set up callbacks for real-time collaboration
    collaborationService.setCallbacks({
      onUserJoined: (data) => {
        console.log('User joined:', data);
        setActiveUsers(data?.activeUsers || []);
      },
      
      onUserLeft: (data) => {
        console.log('User left:', data);
        if (data?.userId) {
          setActiveUsers(prev => prev.filter(u => u?.id !== data.userId));
        }
      },
      
      onContentUpdated: (data) => {
        console.log('Content updated:', data);
        // Only apply changes from others, not our own
        if (user && data?.userId !== user._id) {
          isLocalChange.current = true;
          setText(data?.delta?.content || '');
          setVersion(data?.version || 1);
          isLocalChange.current = false;
          
          // Call the onContentChange callback
          if (onContentChange) {
            onContentChange(data?.delta?.content || '');
          }
        }
      },
      
      onDocumentState: (data) => {
        console.log('Document state received:', data);
        isLocalChange.current = true;
        setText(data?.content || '');
        setVersion(data?.version || 1);
        isLocalChange.current = false;
        
        // Call the onContentChange callback
        if (onContentChange) {
          onContentChange(data?.content || '');
        }
      },
      
      onSyncRequired: (data) => {
        console.log('Sync required:', data);
        isLocalChange.current = true;
        setText(data?.content || '');
        setVersion(data?.version || 1);
        isLocalChange.current = false;
        
        // Call the onContentChange callback
        if (onContentChange) {
          onContentChange(data?.content || '');
        }
      },
      
      onError: (data) => {
        console.error('Collaboration error:', data);
      }
    });
    
    // Send periodic activity updates
    const activityInterval = setInterval(() => {
      collaborationService.sendUserActivity();
    }, 30000);
    
    // Cleanup on unmount
    return () => {
      clearInterval(activityInterval);
      if (document && document._id) {
        collaborationService.leaveDocument(document._id);
      }
    };
  }, [document, onContentChange]);
  
  // Handle text changes
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setIsSaved(false);
    
    // Call the onContentChange callback
    if (onContentChange) {
      onContentChange(newText);
    }
    
    // Send changes to collaboration service
    if (!isLocalChange.current && document && document?._id) {
      collaborationService.updateContent(document._id, newText);
    }
    
    // Debounce saving to the server
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(newText);
    }, 2000);
  };
  
  // Save document to server
  const saveDocument = async (content) => {
    if (!document || !document?._id) return;
    
    try {
      const result = await documentService.updateDocument(document._id, {
        content,
        version: version + 1
      });
      
      if (result?.success) {
        setIsSaved(true);
        setLastSaved(new Date());
        setVersion(prev => prev + 1);
      } else {
        console.error('Error saving document:', result?.error);
      }
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };
  
  // Force save document
  const handleSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveDocument(text);
  };
  
  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <div className="active-users">
          {activeUsers && activeUsers.length > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-500">Active users:</span>
              {activeUsers.map(user => (
                <span 
                  key={user?.id || Math.random()} 
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                >
                  {user?.name || 'Anonymous'}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="save-status">
          {!isSaved && (
            <button 
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Save
            </button>
          )}
          {lastSaved && (
            <span className="text-sm text-gray-500 ml-2">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      <textarea
        ref={textAreaRef}
        value={text}
        onChange={handleTextChange}
        className="w-full h-96 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Start typing..."
      />
    </div>
  );
};

export default UltraSimpleEditor; 