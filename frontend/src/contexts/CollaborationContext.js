import React, { createContext, useState, useEffect, useContext } from 'react';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';
// import { toast } from 'react-toastify';

// Create a mock toast object that does nothing
const toast = {
  info: () => {},
  success: () => {},
  warning: () => {},
  error: () => {}
};

const CollaborationContext = createContext();

export const useCollaboration = () => useContext(CollaborationContext);

export const CollaborationProvider = ({ children }) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [comments, setComments] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [hasAccess, setHasAccess] = useState(true); // Default to true for better UX
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeUsers, setActiveUsers] = useState(new Map());
  const [cursorPositions, setCursorPositions] = useState(new Map());
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    // Set up socket event listeners
    const onConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    const onConnectError = (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setError('Failed to connect to collaboration server. Working in offline mode.');
      toast.error('Failed to connect to collaboration server. Working in offline mode.');
    };

    const onUserJoined = (userData) => {
      console.log('User joined:', userData);
      
      // Update participants
      setParticipants(prev => {
        // Check if user already exists in participants
        if (prev.some(p => p.id === userData.userId)) {
          return prev;
        }
        return [...prev, {
          id: userData.userId,
          name: userData.username || 'Anonymous',
          isCurrentUser: userData.userId === user?.id
        }];
      });
      
      // Update active users
      setActiveUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userData.userId, {
          username: userData.username || 'Anonymous',
          id: userData.userId
        });
        return newMap;
      });
      
      // Don't add system message for personal workspace
      // if (userData.userId !== user?.id) {
      //   addSystemMessage(`${userData.username || 'A user'} has joined the workspace`);
      // }
    };

    const onUserLeft = (data) => {
      const userId = data.userId;
      console.log('User left:', userId);
      
      // Update participants
      setParticipants(prev => {
        const filtered = prev.filter(p => p.id !== userId);
        
        // Don't add system message for personal workspace
        // if (filtered.length < prev.length) {
        //   const leftUser = prev.find(p => p.id === userId);
        //   addSystemMessage(`${leftUser?.name || 'A user'} has left the workspace`);
        // }
        
        return filtered;
      });
      
      // Update active users
      setActiveUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
      
      // Remove cursor position
      setCursorPositions(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    };

    const onAccessGranted = (data) => {
      console.log('Access granted to workspace', data);
      if (data.userId === user?.id) {
        setHasAccess(true);
        toast.success('You have been granted access to this workspace');
      }
    };

    const onAccessRevoked = (data) => {
      console.log('Access revoked from workspace', data);
      if (data.userId === user?.id) {
        setHasAccess(false);
        toast.warning('Your access to this workspace has been revoked');
      }
    };

    const onChatMessage = (message) => {
      console.log('Chat message received:', message);
      setMessages(prev => [...prev, message]);
    };

    const onCommentAdded = (comment) => {
      console.log('Comment added:', comment);
      setComments(prev => [...prev, comment]);
    };

    const onCommentUpdated = (updatedComment) => {
      console.log('Comment updated:', updatedComment);
      setComments(prev => 
        prev.map(c => c.id === updatedComment.id ? updatedComment : c)
      );
    };

    const onCommentDeleted = (commentId) => {
      console.log('Comment deleted:', commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    };

    // Add event handlers for cursor positions
    const onCursorMove = (data) => {
      if (!data || !data.userId) return;
      
      setCursorPositions(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, data.position);
        return newMap;
      });
    };

    // Register event listeners
    socketService.on('connect', onConnect);
    socketService.on('disconnect', onDisconnect);
    socketService.on('connect_error', onConnectError);
    socketService.on('user-joined', onUserJoined);
    socketService.on('user-left', onUserLeft);
    socketService.on('access-granted', onAccessGranted);
    socketService.on('access-revoked', onAccessRevoked);
    socketService.on('chat-message', onChatMessage);
    socketService.on('comment-added', onCommentAdded);
    socketService.on('comment-updated', onCommentUpdated);
    socketService.on('comment-deleted', onCommentDeleted);
    socketService.on('cursor-move', onCursorMove);

    // Check initial connection status
    setIsConnected(socketService.connected);

    // Clean up event listeners
    return () => {
      socketService.off('connect', onConnect);
      socketService.off('disconnect', onDisconnect);
      socketService.off('connect_error', onConnectError);
      socketService.off('user-joined', onUserJoined);
      socketService.off('user-left', onUserLeft);
      socketService.off('access-granted', onAccessGranted);
      socketService.off('access-revoked', onAccessRevoked);
      socketService.off('chat-message', onChatMessage);
      socketService.off('comment-added', onCommentAdded);
      socketService.off('comment-updated', onCommentUpdated);
      socketService.off('comment-deleted', onCommentDeleted);
      socketService.off('cursor-move', onCursorMove);
    };
  }, [user]);

  // Join a workspace
  const joinWorkspace = (workspaceId, userId, userName) => {
    if (!workspaceId) {
      console.error('No workspace ID provided');
      toast.error('No workspace ID provided');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Reset state when joining a new workspace
      setParticipants([]);
      setMessages([]);
      setComments([]);
      setCurrentWorkspace(workspaceId);

      // Add current user to participants immediately for better UX
      if (user) {
        setParticipants([{
          id: user.id,
          name: user.name || userName || 'You',
          isCurrentUser: true
        }]);
      }

      // Check if we're already in offline mode
      if (offlineMode) {
        console.log('Already in offline mode, setting up workspace locally');
        setIsLoading(false);
        return true;
      }

      // Try to join the workspace
      const success = socketService.joinWorkspace(workspaceId, userId || user?.id || 'anonymous', userName || user?.name || 'Anonymous');
      
      if (success) {
        // Don't add system message for personal workspace
        // addSystemMessage('You joined the workspace');
        setIsLoading(false);
        return true;
      } else {
        // If not immediately successful, we'll wait for the connection to be established
        // The socketService will handle the join when connected
        setTimeout(() => {
          // Check if we're still loading after 3 seconds
          setIsLoading(prev => {
            if (prev) {
              // If we're still loading, assume we're in offline mode
              enterOfflineMode();
              return false;
            }
            return prev;
          });
        }, 3000);
        
        return true; // Return true to indicate we're attempting to join
      }
    } catch (error) {
      console.error('Error joining workspace:', error);
      setError(`Failed to join workspace: ${error.message}`);
      setIsLoading(false);
      toast.error(`Failed to join workspace: ${error.message}`);
      enterOfflineMode();
      return false;
    }
  };

  // Leave the current workspace
  const leaveWorkspace = () => {
    if (currentWorkspace) {
      try {
        console.log('Leaving workspace:', currentWorkspace);
        const success = socketService.leaveWorkspace(currentWorkspace);
        
        // Reset state regardless of success
        setCurrentWorkspace(null);
        setParticipants([]);
        setMessages([]);
        setComments([]);
        setHasAccess(true); // Reset access for next workspace
        setError(null);
        
        return success;
      } catch (error) {
        console.error('Error leaving workspace:', error);
        
        // Reset state anyway
        setCurrentWorkspace(null);
        setParticipants([]);
        setMessages([]);
        setComments([]);
        setHasAccess(true);
        setError(null);
        
        return false;
      }
    }
    return false;
  };

  // Add a system message
  const addSystemMessage = (content) => {
    const systemMessage = {
      id: Date.now().toString(),
      sender: 'system',
      content,
      timestamp: new Date().toISOString(),
      type: 'system'
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  // Send a chat message
  const sendMessage = (content) => {
    if (!content.trim() || !currentWorkspace) return false;
    
    const message = {
      id: Date.now().toString(),
      sender: user?.id || 'anonymous',
      senderName: user?.name || 'Anonymous',
      content,
      timestamp: new Date().toISOString(),
      type: 'user'
    };
    
    const success = socketService.sendChatMessage(currentWorkspace, message);
    
    // Optimistically add message to local state
    setMessages(prev => [...prev, message]);
    
    return success;
  };

  // Add a comment
  const addComment = (content, position) => {
    if (!content.trim() || !currentWorkspace) return false;
    
    const comment = {
      id: Date.now().toString(),
      author: user?.id || 'anonymous',
      authorName: user?.name || 'Anonymous',
      content,
      position,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    const success = socketService.addComment(currentWorkspace, comment);
    
    // Optimistically add comment to local state
    setComments(prev => [...prev, comment]);
    
    return success;
  };

  // Update a comment
  const updateComment = (commentId, updates) => {
    if (!commentId || !currentWorkspace) return false;
    
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return false;
    
    const updatedComment = { ...comment, ...updates };
    
    const success = socketService.updateComment(currentWorkspace, updatedComment);
    
    // Optimistically update comment in local state
    setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
    
    return success;
  };

  // Delete a comment
  const deleteComment = (commentId) => {
    if (!commentId || !currentWorkspace) return false;
    
    const success = socketService.deleteComment(currentWorkspace, commentId);
    
    // Optimistically remove comment from local state
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    return success;
  };

  // Get socket connection status
  const getConnectionStatus = () => {
    return socketService.getStatus();
  };

  // Add enterOfflineMode method
  const enterOfflineMode = () => {
    console.log('Entering offline mode from context');
    setIsConnected(false);
    setOfflineMode(true);
    
    // Add current user to participants for better UX
    if (user) {
      setParticipants([{
        id: user.id,
        name: user.name || 'You',
        isCurrentUser: true
      }]);
    }
    
    // Call socketService's enterOfflineMode if it exists
    if (typeof socketService.enterOfflineMode === 'function') {
      socketService.enterOfflineMode();
    } else {
      console.warn('socketService.enterOfflineMode is not a function');
    }
    
    // Add a system message about offline mode (but don't display it)
    // addSystemMessage('Working in offline mode. Changes will be saved locally.');
    
    // Don't show toast notification for offline mode
    // toast.warning('Working in offline mode. Changes will be saved locally.', {
    //   autoClose: false,
    //   toastId: 'offline-mode-toast'
    // });
  };

  return (
    <CollaborationContext.Provider
      value={{
        isConnected,
        currentWorkspace,
        participants,
        messages,
        comments,
        hasAccess,
        isLoading,
        error,
        activeUsers,
        cursorPositions,
        offlineMode,
        joinWorkspace,
        leaveWorkspace,
        sendMessage,
        addComment,
        updateComment,
        deleteComment,
        getConnectionStatus,
        enterOfflineMode
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
};

export default CollaborationContext; 