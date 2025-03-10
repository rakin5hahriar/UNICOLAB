import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

export const CollaborationContext = createContext();

export const CollaborationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to collaboration server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
    });

    newSocket.on('session_joined', (sessionData) => {
      setActiveSession(sessionData);
      setParticipants(sessionData.participants);
    });

    newSocket.on('participant_joined', (participant) => {
      setParticipants(prev => [...prev, participant]);
    });

    newSocket.on('participant_left', (participantId) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    });

    newSocket.on('message_received', (message) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const createSession = async (sessionData) => {
    if (!socket) return null;
    
    socket.emit('create_session', {
      ...sessionData,
      createdBy: user.id
    });

    return new Promise((resolve) => {
      socket.once('session_created', (newSession) => {
        setActiveSession(newSession);
        resolve(newSession);
      });
    });
  };

  const joinSession = async (sessionId) => {
    if (!socket) return;

    socket.emit('join_session', {
      sessionId,
      userId: user.id,
      username: user.name
    });
  };

  const leaveSession = () => {
    if (!socket || !activeSession) return;

    socket.emit('leave_session', {
      sessionId: activeSession.id,
      userId: user.id
    });

    setActiveSession(null);
    setParticipants([]);
    setMessages([]);
  };

  const sendMessage = (content) => {
    if (!socket || !activeSession) return;

    const message = {
      content,
      sender: user.id,
      senderName: user.name,
      timestamp: new Date().toISOString()
    };

    socket.emit('send_message', {
      sessionId: activeSession.id,
      message
    });
  };

  const value = {
    socket,
    activeSession,
    participants,
    messages,
    createSession,
    joinSession,
    leaveSession,
    sendMessage
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}; 