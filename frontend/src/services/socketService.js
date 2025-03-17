import { io } from 'socket.io-client';
// import { toast } from 'react-toastify';

// Create a mock toast object that does nothing
const toast = {
  info: () => {},
  success: () => {},
  warning: () => {},
  error: () => {}
};

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.workspaceId = null;
    this.userId = null;
    this.username = null;
    this.eventHandlers = new Map();
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.pendingActions = [];
    this.offlineMode = false;
    this.localWhiteboardElements = [];
    this.activeUsers = null;
    this.cursorPositions = null;
    this._lastJoinAttempt = 0;
    this._joinedWorkspaces = new Set(); // Track workspaces we've joined
    this._connectionLock = false; // Lock to prevent multiple simultaneous connections
    this._joinLock = false; // Lock to prevent multiple simultaneous join attempts
    
    // Load any saved offline data
    this.loadOfflineData();
  }

  connect(serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000') {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      this.emitConnectionStatus(true);
      return this;
    }

    if (this.isConnecting) {
      console.log('Already attempting to connect, waiting...');
      return this;
    }
    
    // Use a connection lock to prevent multiple simultaneous connection attempts
    if (this._connectionLock) {
      console.log('Connection locked, waiting for previous connection attempt to complete');
      return this;
    }
    
    // Set the connection lock
    this._connectionLock = true;
    
    console.log('Connecting to socket server:', serverUrl);
    this.isConnecting = true;
    
    try {
      // Force to use localhost:5000 for development
      const socketUrl = 'http://localhost:5000';
      console.log('Using socket URL:', socketUrl);
      
      // Set a timeout to enter offline mode if connection takes too long
      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.log('Connection timeout, entering offline mode');
          this.enterOfflineMode();
        }
      }, 5000);
      
      this.socket = io(socketUrl, {
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });
      
      this.setupSocketEvents(connectionTimeout);
      
      // Set a timeout to clear the connection lock if connection takes too long
      setTimeout(() => {
        this._connectionLock = false;
      }, 5000);
      
      return this;
    } catch (error) {
      console.error('Error connecting to socket server:', error);
      this.isConnecting = false;
      this._connectionLock = false;
      
      // Enter offline mode immediately on error
      this.enterOfflineMode();
      
      return this;
    }
  }

  processPendingActions() {
    if (this.pendingActions.length > 0) {
      console.log(`Processing ${this.pendingActions.length} pending actions`);
      
      while (this.pendingActions.length > 0) {
        const action = this.pendingActions.shift();
        try {
          action();
        } catch (error) {
          console.error('Error processing pending action:', error);
        }
      }
    }
  }

  setupDefaultListeners() {
    if (!this.socket) return;
    
    // These are events that we want to handle globally
    this.socket.on('user-joined', (data) => {
      console.log('User joined event received:', data);
      if (this.eventHandlers.has('user-joined')) {
        this.eventHandlers.get('user-joined').forEach(handler => handler(data));
      }
      // Don't show toast for user joining - this is a personal workspace
      // toast.info(`${data.username} joined the workspace`);
    });

    this.socket.on('user-left', (data) => {
      console.log('User left event received:', data);
      if (this.eventHandlers.has('user-left')) {
        this.eventHandlers.get('user-left').forEach(handler => handler(data));
      }
    });

    this.socket.on('access-granted', (data) => {
      console.log('Access granted event received:', data);
      if (this.eventHandlers.has('access-granted')) {
        this.eventHandlers.get('access-granted').forEach(handler => handler(data));
      }
      toast.success(`Access granted to ${data.userId}`);
    });

    this.socket.on('access-revoked', (data) => {
      console.log('Access revoked event received:', data);
      if (this.eventHandlers.has('access-revoked')) {
        this.eventHandlers.get('access-revoked').forEach(handler => handler(data));
      }
      toast.info(`Access revoked for ${data.userId}`);
    });

    // Set up whiteboard event listeners
    this.socket.on('whiteboard-init', (data) => {
      console.log('Whiteboard init event received:', data);
      if (data.elements && Array.isArray(data.elements)) {
        // Create a deep copy to avoid reference issues
        this.localWhiteboardElements = JSON.parse(JSON.stringify(data.elements));
        console.log(`Stored ${this.localWhiteboardElements.length} elements locally`);
      }
      if (this.eventHandlers.has('whiteboard-init')) {
        this.eventHandlers.get('whiteboard-init').forEach(handler => handler(data));
      }
    });

    this.socket.on('whiteboard-element-added', (data) => {
      console.log('Whiteboard element added event received:', data);
      if (data.element) {
        // Check if element already exists to avoid duplicates
        const existingIndex = this.localWhiteboardElements.findIndex(el => el.id === data.element.id);
        if (existingIndex === -1) {
          this.localWhiteboardElements.push(data.element);
          console.log(`Added element ${data.element.id} to local storage`);
        } else {
          console.log('Duplicate element detected in socket service, not adding:', data.element.id);
        }
      }
      if (this.eventHandlers.has('whiteboard-element-added')) {
        this.eventHandlers.get('whiteboard-element-added').forEach(handler => handler(data));
      }
    });

    this.socket.on('whiteboard-element-updated', (data) => {
      console.log('Whiteboard element updated event received:', data);
      if (data.elementId && data.updates) {
        const elementIndex = this.localWhiteboardElements.findIndex(el => el.id === data.elementId);
        if (elementIndex !== -1) {
          this.localWhiteboardElements[elementIndex] = {
            ...this.localWhiteboardElements[elementIndex],
            ...data.updates
          };
        }
      }
      if (this.eventHandlers.has('whiteboard-element-updated')) {
        this.eventHandlers.get('whiteboard-element-updated').forEach(handler => handler(data));
      }
    });

    this.socket.on('whiteboard-element-deleted', (data) => {
      console.log('Whiteboard element deleted event received:', data);
      if (data.elementId) {
        this.localWhiteboardElements = this.localWhiteboardElements.filter(
          el => el.id !== data.elementId
        );
      }
      if (this.eventHandlers.has('whiteboard-element-deleted')) {
        this.eventHandlers.get('whiteboard-element-deleted').forEach(handler => handler(data));
      }
    });

    this.socket.on('whiteboard-cleared', (data) => {
      console.log('Whiteboard cleared event received:', data);
      this.localWhiteboardElements = [];
      if (this.eventHandlers.has('whiteboard-cleared')) {
        this.eventHandlers.get('whiteboard-cleared').forEach(handler => handler(data));
      }
    });

    // Set up text editor event listeners
    this.socket.on('text-editor-init', (data) => {
      console.log('Text editor init event received:', data);
      if (this.eventHandlers.has('text-editor-init')) {
        this.eventHandlers.get('text-editor-init').forEach(handler => handler(data));
      }
    });

    this.socket.on('text-editor-update', (data) => {
      console.log('Text editor update event received:', data);
      if (this.eventHandlers.has('text-editor-update')) {
        this.eventHandlers.get('text-editor-update').forEach(handler => handler(data));
      }
    });

    this.socket.on('text-editor-selection', (data) => {
      console.log('Text editor selection event received:', data);
      if (this.eventHandlers.has('text-editor-selection')) {
        this.eventHandlers.get('text-editor-selection').forEach(handler => handler(data));
      }
    });

    this.socket.on('text-editor-typing', (data) => {
      console.log('Text editor typing event received:', data);
      if (this.eventHandlers.has('text-editor-typing')) {
        this.eventHandlers.get('text-editor-typing').forEach(handler => handler(data));
      }
    });
    
    this.socket.on('text-editor-metadata', (data) => {
      console.log('Text editor metadata event received:', data);
      if (this.eventHandlers.has('text-editor-metadata')) {
        this.eventHandlers.get('text-editor-metadata').forEach(handler => handler(data));
      }
    });

    // Set up text document event listeners for Google Docs-like editor
    this.socket.on('text-document-update', (data) => {
      console.log('Text document update event received:', data);
      if (this.eventHandlers.has('text-document-update')) {
        this.eventHandlers.get('text-document-update').forEach(handler => handler(data));
      }
    });
    
    this.socket.on('text-document-title-update', (data) => {
      console.log('Text document title update event received:', data);
      if (this.eventHandlers.has('text-document-title-update')) {
        this.eventHandlers.get('text-document-title-update').forEach(handler => handler(data));
      }
    });
    
    this.socket.on('text-document-state', (data) => {
      console.log('Text document state event received:', data);
      if (this.eventHandlers.has('text-document-state')) {
        this.eventHandlers.get('text-document-state').forEach(handler => handler(data));
      }
    });
    
    this.socket.on('collaborators-update', (data) => {
      console.log('Collaborators update event received:', data);
      if (this.eventHandlers.has('collaborators-update')) {
        this.eventHandlers.get('collaborators-update').forEach(handler => handler(data));
      }
    });
  }

  joinWorkspace(workspaceId, userId, username) {
    if (!workspaceId || !userId) {
      console.error('Cannot join workspace: missing workspaceId or userId');
      return false;
    }

    // If we're already in this workspace with this user, don't rejoin
    if (this.workspaceId === workspaceId && this.userId === userId) {
      console.log('Already joined this workspace as this user, skipping');
      return true;
    }
    
    // Use a join lock to prevent multiple simultaneous join attempts
    if (this._joinLock) {
      console.log('Join locked, waiting for previous join attempt to complete');
      return false;
    }
    
    // Set the join lock
    this._joinLock = true;
    
    // Add a timestamp to track when we last tried to join this workspace
    const now = Date.now();
    const lastJoinAttempt = this._lastJoinAttempt || 0;
    
    // If we tried to join less than 1 second ago, throttle the request
    if (now - lastJoinAttempt < 1000) {
      console.log('Throttling join workspace request, too many attempts');
      this._joinLock = false; // Release the join lock
      return false;
    }
    
    // Update the last join attempt timestamp
    this._lastJoinAttempt = now;

    console.log(`Joining workspace ${workspaceId} as user ${userId} (${username})`);
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.username = username || 'Anonymous';

    // If we're in offline mode, set up the workspace for offline use
    if (this.offlineMode) {
      console.log('In offline mode, setting up workspace for offline use');
      
      // Add current user to active users
      if (!this.activeUsers) {
        this.activeUsers = new Map();
      }
      
      this.activeUsers.set(userId, {
        username: username || 'Anonymous',
        lastActive: new Date()
      });
      
      // Trigger whiteboard-init event with local elements
      if (this.eventHandlers.has('whiteboard-init')) {
        setTimeout(() => {
          this.eventHandlers.get('whiteboard-init').forEach(handler => 
            handler({ elements: this.localWhiteboardElements || [] })
          );
        }, 500);
      }
      
      // Trigger text-editor-init event with empty content
      if (this.eventHandlers.has('text-editor-init')) {
        setTimeout(() => {
          this.eventHandlers.get('text-editor-init').forEach(handler => 
            handler({ content: '', lastUpdated: new Date() })
          );
        }, 500);
      }
      
      // Mark this workspace as joined
      this._joinedWorkspaces.add(workspaceId);
      
      this._joinLock = false; // Release the join lock
      return true;
    }

    if (!this.socket) {
      console.error('Socket not initialized, connecting now');
      this.connect();
      
      // Add to pending actions
      this.pendingActions.push(() => {
        this._joinLock = false; // Release the join lock
        this.emitJoinWorkspace();
      });
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, will join workspace when connected');
      
      // Add to pending actions
      this.pendingActions.push(() => {
        this._joinLock = false; // Release the join lock
        this.emitJoinWorkspace();
      });
      
      // If we're in offline mode, trigger the whiteboard-init event with empty elements
      if (this.offlineMode && this.eventHandlers.has('whiteboard-init')) {
        setTimeout(() => {
          this.eventHandlers.get('whiteboard-init').forEach(handler => 
            handler({ elements: this.localWhiteboardElements || [] })
          );
        }, 500);
      }
      
      return false;
    }

    const result = this.emitJoinWorkspace();
    this._joinLock = false; // Release the join lock
    return result;
  }

  leaveWorkspace(workspaceId) {
    if (!workspaceId) {
      console.error('Cannot leave workspace: missing workspaceId');
      return false;
    }

    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot leave workspace');
      
      // Reset workspace data anyway
      this.workspaceId = null;
      this.userId = null;
      this.username = null;
      
      // Remove from joined workspaces set
      if (this._joinedWorkspaces) {
        this._joinedWorkspaces.delete(workspaceId);
      }
      
      return true;
    }

    try {
      console.log('Leaving workspace:', workspaceId);
      this.socket.emit('leave-workspace', {
        workspaceId: workspaceId,
        userId: this.userId
      });
      
      // Reset workspace data
      this.workspaceId = null;
      this.userId = null;
      this.username = null;
      
      // Remove from joined workspaces set
      if (this._joinedWorkspaces) {
        this._joinedWorkspaces.delete(workspaceId);
      }
      
      return true;
    } catch (error) {
      console.error('Error leaving workspace:', error);
      return false;
    }
  }

  emitJoinWorkspace() {
    if (!this.socket || !this.isConnected || !this.workspaceId || !this.userId) {
      console.error('Cannot join workspace: socket not connected or missing data', {
        socketExists: !!this.socket,
        isConnected: this.isConnected,
        workspaceId: this.workspaceId,
        userId: this.userId
      });
      return false;
    }

    // Check if we've already joined this workspace
    if (this._joinedWorkspaces.has(this.workspaceId)) {
      console.log(`Already joined workspace ${this.workspaceId}, not sending duplicate join event`);
      return true;
    }

    console.log('Joining workspace:', this.workspaceId, 'as user:', this.userId, this.username);

    try {
      this.socket.emit('join-workspace', {
        workspaceId: this.workspaceId,
        userId: this.userId,
        username: this.username
      });
      
      // Mark this workspace as joined
      this._joinedWorkspaces.add(this.workspaceId);
      
      // Log success
      console.log('Successfully sent join-workspace event');
      
      return true;
    } catch (error) {
      console.error('Error joining workspace:', error);
      this._joinLock = false; // Release the join lock in case of error
      return false;
    }
  }

  // Whiteboard methods
  addWhiteboardElement(element) {
    if (!element) return false;
    
    if (this.offlineMode) {
      console.log('Adding whiteboard element in offline mode');
      
      // Add to local whiteboard elements
      if (!this.localWhiteboardElements) {
        this.localWhiteboardElements = [];
      }
      
      this.localWhiteboardElements.push(element);
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('offline-whiteboard', JSON.stringify(this.localWhiteboardElements));
      } catch (error) {
        console.error('Error saving whiteboard to localStorage:', error);
      }
      
      // Emit event to update UI
      if (this.eventHandlers.has('whiteboard-element-added')) {
        this.eventHandlers.get('whiteboard-element-added').forEach(handler => 
          handler({ element })
        );
      }
      
      return true;
    }
    
    if (!this.socket || !this.isConnected || !this.workspaceId) {
      console.error('Cannot add whiteboard element: socket not connected or missing workspaceId');
      return false;
    }
    
    try {
      this.socket.emit('whiteboard-element-add', {
        workspaceId: this.workspaceId,
        element
      });
      return true;
    } catch (error) {
      console.error('Error adding whiteboard element:', error);
      return false;
    }
  }

  getWhiteboardState(workspaceId) {
    const targetWorkspaceId = workspaceId || this.workspaceId;
    
    if (!targetWorkspaceId) {
      console.error('Cannot get whiteboard state: workspaceId missing');
      return false;
    }

    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot get whiteboard state');
      
      // If we're in offline mode, trigger the whiteboard-init event with local elements
      if (this.offlineMode && this.eventHandlers.has('whiteboard-init')) {
        setTimeout(() => {
          this.eventHandlers.get('whiteboard-init').forEach(handler => 
            handler({ elements: this.localWhiteboardElements || [] })
          );
        }, 500);
      } else {
        // Add to pending actions to request when connected
        this.pendingActions.push(() => this.getWhiteboardState(targetWorkspaceId));
      }
      
      return false;
    }

    try {
      console.log('Requesting whiteboard state for workspace:', targetWorkspaceId);
      this.socket.emit('get-whiteboard', {
        workspaceId: targetWorkspaceId
      });
      return true;
    } catch (error) {
      console.error('Error requesting whiteboard state:', error);
      return false;
    }
  }

  updateWhiteboardElement(elementId, updates) {
    if (!elementId || !updates) {
      console.error('Cannot update whiteboard element: elementId or updates missing');
      return false;
    }
    
    // Always update local elements
    this.localWhiteboardElements = this.localWhiteboardElements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    
    if (!this.socket || !this.workspaceId) {
      console.error('Cannot update whiteboard element: socket or workspaceId missing', {
        socketExists: !!this.socket,
        workspaceId: this.workspaceId
      });
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, cannot update whiteboard element');
      
      // Add to pending actions to send when reconnected
      this.pendingActions.push(() => this.updateWhiteboardElement(elementId, updates));
      
      return false;
    }

    try {
      console.log('Updating whiteboard element on server:', elementId);
      this.socket.emit('whiteboard-element-update', {
        workspaceId: this.workspaceId,
        elementId,
        updates,
        userId: this.userId
      });
      
      // Log success
      console.log('Successfully sent whiteboard element update to server');
      
      return true;
    } catch (error) {
      console.error('Error updating whiteboard element:', error);
      
      // Add to pending actions to retry later
      this.pendingActions.push(() => this.updateWhiteboardElement(elementId, updates));
      
      return false;
    }
  }

  deleteWhiteboardElement(elementId) {
    if (!elementId) {
      console.error('Cannot delete whiteboard element: elementId missing');
      return false;
    }
    
    // Always delete from local elements
    this.localWhiteboardElements = this.localWhiteboardElements.filter(el => 
      el.id !== elementId
    );
    
    if (!this.socket || !this.workspaceId) {
      console.error('Cannot delete whiteboard element: socket or workspaceId missing', {
        socketExists: !!this.socket,
        workspaceId: this.workspaceId
      });
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, cannot delete whiteboard element');
      
      // Add to pending actions to send when reconnected
      this.pendingActions.push(() => this.deleteWhiteboardElement(elementId));
      
      return false;
    }

    try {
      console.log('Deleting whiteboard element from server:', elementId);
      this.socket.emit('whiteboard-element-delete', {
        workspaceId: this.workspaceId,
        elementId,
        userId: this.userId
      });
      
      // Log success
      console.log('Successfully sent whiteboard element deletion to server');
      
      return true;
    } catch (error) {
      console.error('Error deleting whiteboard element:', error);
      
      // Add to pending actions to retry later
      this.pendingActions.push(() => this.deleteWhiteboardElement(elementId));
      
      return false;
    }
  }

  clearWhiteboard() {
    // Always clear local elements
    this.localWhiteboardElements = [];
    
    if (!this.socket || !this.workspaceId) {
      console.error('Cannot clear whiteboard: socket or workspaceId missing');
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, cannot clear whiteboard');
      return false;
    }

    try {
      console.log('Clearing whiteboard');
      this.socket.emit('whiteboard-clear', {
        workspaceId: this.workspaceId,
        userId: this.userId
      });
      return true;
    } catch (error) {
      console.error('Error clearing whiteboard:', error);
      return false;
    }
  }

  // Access control methods
  grantAccess(grantedUserId) {
    if (!this.socket || !this.workspaceId) {
      console.error('Cannot grant access: socket or workspaceId missing');
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, cannot grant access');
      return false;
    }

    try {
      console.log('Granting access to:', grantedUserId);
      this.socket.emit('grant-access', {
        workspaceId: this.workspaceId,
        grantedUserId,
        grantedBy: this.userId
      });
      return true;
    } catch (error) {
      console.error('Error granting access:', error);
      return false;
    }
  }

  revokeAccess(revokedUserId) {
    if (!this.socket || !this.workspaceId) {
      console.error('Cannot revoke access: socket or workspaceId missing');
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, cannot revoke access');
      return false;
    }

    try {
      console.log('Revoking access from:', revokedUserId);
      this.socket.emit('revoke-access', {
        workspaceId: this.workspaceId,
        revokedUserId,
        revokedBy: this.userId
      });
      return true;
    } catch (error) {
      console.error('Error revoking access:', error);
      return false;
    }
  }

  // Event handling
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
      
      // Set up socket listener if it's not a default event and socket exists
      if (this.socket && !['user-joined', 'user-left', 'access-granted', 'access-revoked', 
            'whiteboard-init', 'whiteboard-element-added', 'whiteboard-element-updated',
            'whiteboard-element-deleted', 'whiteboard-cleared', 'text-editor-init', 
            'text-editor-update', 'text-editor-selection', 'text-editor-typing',
            'text-editor-metadata', 'text-document-update', 'text-document-title-update',
            'text-document-state', 'collaborators-update', 'connect', 'disconnect',
            'connection-change'].includes(event)) {
        this.socket.on(event, (data) => {
          console.log(`Event received: ${event}`, data);
          if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(h => h(data));
          }
        });
      }
    }
    
    this.eventHandlers.get(event).add(handler);
    
    // If this is a connection status event, immediately trigger with current status
    if (event === 'connection-change') {
      setTimeout(() => {
        handler({ connected: this.isConnected });
      }, 0);
    }
    
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  // Add emit method to broadcast events to all handlers
  emit(event, data) {
    console.log(`Emitting event: ${event}`, data);
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for event ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.workspaceId = null;
      this.userId = null;
      this.username = null;
      this.eventHandlers.clear();
      this.pendingActions = [];
      this.isConnecting = false;
      
      // Clear the joined workspaces set
      if (this._joinedWorkspaces) {
        this._joinedWorkspaces.clear();
      }
      
      // Reset the last join attempt timestamp
      this._lastJoinAttempt = 0;
    }
  }

  // Debug method to check connection status
  getStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      workspaceId: this.workspaceId,
      userId: this.userId,
      username: this.username,
      connectionAttempts: this.connectionAttempts,
      isConnecting: this.isConnecting,
      pendingActions: this.pendingActions.length,
      offlineMode: this.offlineMode,
      localElementsCount: this.localWhiteboardElements.length
    };
  }

  // Text editor methods
  getTextEditorContent(workspaceId = this.workspaceId) {
    if (!this.socket || !workspaceId) {
      console.error('Cannot get text editor content: socket or workspaceId missing');
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, cannot get text editor content');
      return false;
    }

    try {
      console.log('Requesting text editor content for workspace:', workspaceId);
      this.socket.emit('text-editor-request-content', {
        workspaceId,
        userId: this.userId
      });
      return true;
    } catch (error) {
      console.error('Error requesting text editor content:', error);
      return false;
    }
  }

  // Text Document methods for our Google Docs-like editor
  joinTextDocument(documentId, userId, username) {
    if (!documentId || !userId) {
      console.error('Cannot join text document: missing documentId or userId');
      return false;
    }

    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot join text document');
      
      // Add to pending actions
      this.pendingActions.push(() => this.joinTextDocument(documentId, userId, username));
      return false;
    }

    try {
      console.log('Joining text document:', documentId, 'as user:', userId, username);
      this.socket.emit('join-text-document', {
        documentId,
        userId,
        username: username || 'Anonymous'
      });
      return true;
    } catch (error) {
      console.error('Error joining text document:', error);
      return false;
    }
  }

  leaveTextDocument(documentId) {
    if (!documentId) {
      console.error('Cannot leave text document: missing documentId');
      return false;
    }

    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot leave text document');
      return false;
    }

    try {
      console.log('Leaving text document:', documentId);
      this.socket.emit('leave-text-document', {
        documentId,
        userId: this.userId
      });
      return true;
    } catch (error) {
      console.error('Error leaving text document:', error);
      return false;
    }
  }

  updateTextDocument(documentId, content, userId) {
    if (this.offlineMode) {
      console.log('Updating text document in offline mode');
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('offline-text-content', content);
        localStorage.setItem('offline-text-last-updated', new Date().toISOString());
      } catch (error) {
        console.error('Error saving text content to localStorage:', error);
      }
      
      // Emit event to update UI
      if (this.eventHandlers.has('text-document-update')) {
        this.eventHandlers.get('text-document-update').forEach(handler => 
          handler({ content, userId, timestamp: new Date() })
        );
      }
      
      return true;
    }
    
    if (!this.socket || !this.isConnected) {
      console.error('Cannot update text document: socket not connected');
      return false;
    }
    
    try {
      this.socket.emit('text-document-update', {
        documentId,
        content,
        userId
      });
      return true;
    } catch (error) {
      console.error('Error updating text document:', error);
      return false;
    }
  }

  updateTextDocumentTitle(documentId, title, userId) {
    if (!documentId || !title) {
      console.error('Cannot update text document title: missing documentId or title');
      return false;
    }

    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot update text document title');
      
      // Add to pending actions
      this.pendingActions.push(() => this.updateTextDocumentTitle(documentId, title, userId));
      return false;
    }

    try {
      console.log('Updating text document title:', documentId, title);
      this.socket.emit('text-document-title-update', {
        documentId,
        title,
        sender: userId || this.userId,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating text document title:', error);
      return false;
    }
  }

  requestTextDocumentState(documentId) {
    if (!documentId) {
      console.error('Cannot request text document state: missing documentId');
      return false;
    }

    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot request text document state');
      
      // Add to pending actions
      this.pendingActions.push(() => this.requestTextDocumentState(documentId));
      return false;
    }

    try {
      console.log('Requesting text document state:', documentId);
      this.socket.emit('request-text-document-state', {
        documentId,
        userId: this.userId
      });
      return true;
    } catch (error) {
      console.error('Error requesting text document state:', error);
      return false;
    }
  }

  // Event handlers for text document
  onTextDocumentUpdate(callback) {
    return this.on('text-document-update', callback);
  }

  offTextDocumentUpdate() {
    if (this.eventHandlers.has('text-document-update')) {
      this.eventHandlers.delete('text-document-update');
    }
  }

  onTextDocumentTitleUpdate(callback) {
    return this.on('text-document-title-update', callback);
  }

  offTextDocumentTitleUpdate() {
    if (this.eventHandlers.has('text-document-title-update')) {
      this.eventHandlers.delete('text-document-title-update');
    }
  }

  onTextDocumentState(callback) {
    return this.on('text-document-state', callback);
  }

  offTextDocumentState() {
    if (this.eventHandlers.has('text-document-state')) {
      this.eventHandlers.delete('text-document-state');
    }
  }

  onCollaboratorsUpdate(callback) {
    return this.on('collaborators-update', callback);
  }

  offCollaboratorsUpdate() {
    if (this.eventHandlers.has('collaborators-update')) {
      this.eventHandlers.delete('collaborators-update');
    }
  }

  // Connection event handlers
  onConnect(callback) {
    return this.on('connect', callback);
  }

  onDisconnect(callback) {
    return this.on('disconnect', callback);
  }

  sendTextEditorUpdate(content) {
    if (!this.socket || !this.workspaceId) {
      console.error('Cannot send text editor update: socket or workspaceId missing', {
        socketExists: !!this.socket,
        workspaceId: this.workspaceId
      });
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, cannot send text editor update');
      
      // Add to pending actions to send when reconnected
      this.pendingActions.push(() => this.sendTextEditorUpdate(content));
      
      // Show toast notification
      toast.warning('Changes will be synced when connection is restored');
      
      return false;
    }

    try {
      console.log('Sending text editor update to server');
      this.socket.emit('text-editor-update', {
        workspaceId: this.workspaceId,
        userId: this.userId,
        username: this.username,
        content,
        timestamp: new Date()
      });
      
      // Log success
      console.log('Successfully sent text editor update');
      
      return true;
    } catch (error) {
      console.error('Error sending text editor update:', error);
      
      // Add to pending actions to retry later
      this.pendingActions.push(() => this.sendTextEditorUpdate(content));
      
      return false;
    }
  }

  sendTextEditorSelection(selection) {
    if (!this.socket || !this.workspaceId) {
      console.error('Cannot send text editor selection: socket or workspaceId missing');
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, cannot send text editor selection');
      return false;
    }

    try {
      this.socket.emit('text-editor-selection', {
        workspaceId: this.workspaceId,
        userId: this.userId,
        username: this.username,
        selection,
        timestamp: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error sending text editor selection:', error);
      return false;
    }
  }

  sendTextEditorTypingStatus(isTyping) {
    if (!this.socket || !this.workspaceId) {
      console.error('Cannot send text editor typing status: socket or workspaceId missing');
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, cannot send text editor typing status');
      return false;
    }

    try {
      this.socket.emit('text-editor-typing', {
        workspaceId: this.workspaceId,
        userId: this.userId,
        username: this.username,
        isTyping,
        timestamp: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error sending text editor typing status:', error);
      return false;
    }
  }

  sendTextEditorMetadata(metadata) {
    if (!this.socket || !this.workspaceId) {
      console.error('Cannot send text editor metadata: socket or workspaceId missing', {
        socketExists: !!this.socket,
        workspaceId: this.workspaceId
      });
      return false;
    }

    if (!this.isConnected) {
      console.warn('Socket not connected, cannot send text editor metadata');
      
      // Add to pending actions to send when reconnected
      this.pendingActions.push(() => this.sendTextEditorMetadata(metadata));
      
      return false;
    }

    try {
      console.log('Sending text editor metadata to server:', metadata);
      this.socket.emit('text-editor-metadata', {
        workspaceId: this.workspaceId,
        userId: this.userId,
        username: this.username,
        metadata,
        timestamp: new Date()
      });
      
      // Log success
      console.log('Successfully sent text editor metadata');
      
      return true;
    } catch (error) {
      console.error('Error sending text editor metadata:', error);
      
      // Add to pending actions to retry later
      this.pendingActions.push(() => this.sendTextEditorMetadata(metadata));
      
      return false;
    }
  }

  // Helper method to emit connection status to all handlers
  emitConnectionStatus(isConnected) {
    console.log('Emitting connection status:', isConnected);
    this.isConnected = isConnected;
    this.emit('connection-change', { connected: isConnected });
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.socket && this.socket.connected;
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      console.log(`Attempting to reconnect (attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts})...`);
      
      this.reconnectTimeout = setTimeout(() => {
        if (!this.isConnected && !this.isConnecting) {
          this.connect();
        }
      }, 2000); // Shorter delay for faster reconnection
    } else {
      console.log('Maximum reconnection attempts reached. Entering offline mode.');
      this.offlineMode = true;
      
      // Try one final reconnection after a longer delay
      this.reconnectTimeout = setTimeout(() => {
        console.log('Attempting final reconnection...');
        this.connectionAttempts = 0; // Reset counter for a fresh start
        this.connect();
      }, 10000);
    }
  }

  // Send a chat message to the workspace
  sendChatMessage(messageData) {
    if (!this.isSocketConnected()) {
      console.warn('Cannot send chat message while offline');
      this.addPendingAction('send-chat-message', messageData);
      return false;
    }

    try {
      this.socket.emit('chat-message', {
        workspaceId: this.workspaceId,
        userId: messageData.userId || this.userId,
        username: messageData.username || this.username,
        content: messageData.content,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error sending chat message:', error);
      return false;
    }
  }

  // New method to enter offline mode
  enterOfflineMode() {
    if (this.offlineMode) return; // Already in offline mode
    
    this.isConnected = false;
    this.isConnecting = false;
    this.offlineMode = true;
    
    // Release locks
    this._connectionLock = false;
    this._joinLock = false;
    
    // Emit connection status change
    this.emitConnectionStatus(false);
    
    console.log('Entering offline mode');
    
    // Stop further connection attempts
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Clear any pending reconnect timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Create a mock active users map if needed
    if (!this.activeUsers) {
      this.activeUsers = new Map();
    }
    
    // Add current user to active users if we have user info
    if (this.userId && this.username) {
      this.activeUsers.set(this.userId, {
        username: this.username,
        lastActive: new Date()
      });
    }
    
    // Create a mock cursor positions map if needed
    if (!this.cursorPositions) {
      this.cursorPositions = new Map();
    }
    
    // Clear the joined workspaces set
    if (this._joinedWorkspaces) {
      this._joinedWorkspaces.clear();
    }
    
    // Reset the last join attempt timestamp
    this._lastJoinAttempt = 0;
    
    // Trigger whiteboard-init event with local elements for offline mode
    if (this.eventHandlers.has('whiteboard-init')) {
      setTimeout(() => {
        console.log('Triggering whiteboard-init event in offline mode');
        this.eventHandlers.get('whiteboard-init').forEach(handler => 
          handler({ elements: this.localWhiteboardElements || [] })
        );
      }, 500);
    }
    
    // Trigger text-editor-init event with local content for offline mode
    if (this.eventHandlers.has('text-editor-init')) {
      setTimeout(() => {
        console.log('Triggering text-editor-init event in offline mode');
        // Use stored content if available, otherwise empty
        const content = localStorage.getItem('offline-text-content') || '';
        this.eventHandlers.get('text-editor-init').forEach(handler => 
          handler({ content, lastUpdated: new Date() })
        );
      }, 500);
    }
    
    // Execute any pending actions that might be waiting for connection
    this.pendingActions.forEach(action => {
      try {
        action();
      } catch (error) {
        console.error('Error executing pending action in offline mode:', error);
      }
    });
    
    // Clear pending actions
    this.pendingActions = [];
    
    // Notify that we're in offline mode
    console.log('Offline mode enabled - whiteboard and text editor will work locally');
  }

  setupSocketEvents(connectionTimeout) {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      if (connectionTimeout) clearTimeout(connectionTimeout);
      this.isConnected = true;
      this.isConnecting = false;
      this.connectionAttempts = 0;
      this.offlineMode = false;
      this._connectionLock = false; // Release the connection lock
      console.log('Socket connected:', this.socket.id);
      
      // Process any pending actions
      this.processPendingActions();
      
      // Rejoin workspace if we were in one
      if (this.workspaceId && this.userId && this.username) {
        this.emitJoinWorkspace();
      }
      
      // Emit connection change event
      this.emitConnectionStatus(true);

      // Don't show success toast for personal workspace
      // if (this.connectionAttempts > 0) {
      //   toast.success('Connected to collaboration server');
      // }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (connectionTimeout) clearTimeout(connectionTimeout);
      this._connectionLock = false; // Release the connection lock
      
      // Only enter offline mode if we've tried a few times
      this.connectionAttempts++;
      if (this.connectionAttempts >= 2) {
        this.enterOfflineMode();
      } else {
        console.log(`Connection attempt ${this.connectionAttempts} failed, retrying...`);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this._connectionLock = false; // Release the connection lock
      console.log('Socket disconnected:', reason);
      
      // Emit connection change event
      this.emitConnectionStatus(false);

      // Don't show warning toast for personal workspace
      // if (this.connectionAttempts === 0) {
      //   toast.warning('Disconnected from collaboration server. Working in offline mode.');
      // }
      
      // Don't immediately enter offline mode on disconnect
      // The socket.io reconnection will try to reconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // These are permanent disconnects, so enter offline mode
        this.enterOfflineMode();
      }
    });

    // Set up default event listeners
    this.setupDefaultListeners();
  }

  // Load offline data when initializing
  loadOfflineData() {
    console.log('Loading offline data');
    
    // Load whiteboard elements from localStorage
    try {
      const savedWhiteboard = localStorage.getItem('offline-whiteboard');
      if (savedWhiteboard) {
        this.localWhiteboardElements = JSON.parse(savedWhiteboard);
        console.log(`Loaded ${this.localWhiteboardElements.length} whiteboard elements from localStorage`);
      }
    } catch (error) {
      console.error('Error loading whiteboard from localStorage:', error);
      this.localWhiteboardElements = [];
    }
    
    // Load text content from localStorage
    try {
      const savedContent = localStorage.getItem('offline-text-content');
      if (savedContent) {
        console.log('Loaded text content from localStorage');
      }
    } catch (error) {
      console.error('Error loading text content from localStorage:', error);
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();

// Initialize connection
socketService.connect();

export default socketService; 