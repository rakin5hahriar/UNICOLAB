import { toast } from 'react-toastify';
import { nanoid } from 'nanoid';

class MockSocketService {
  constructor() {
    this.connected = true;
    this.workspaceId = null;
    this.userId = null;
    this.username = null;
    this.eventHandlers = new Map();
    this.activeUsers = new Map();
    this.whiteboardElements = new Map(); // Map of workspaceId -> elements[]
    this.socket = { emit: this.emit.bind(this) };
  }

  connect() {
    console.log('Mock socket connected');
    this.connected = true;
    
    // Simulate connection event
    setTimeout(() => {
      if (this.workspaceId && this.userId && this.username) {
        this.joinWorkspace(this.workspaceId, this.userId, this.username);
      }
    }, 500);
    
    return this;
  }

  emit(event, data) {
    console.log('Mock socket emit:', event, data);
    
    // Handle different events
    switch (event) {
      case 'join-workspace':
        this.handleJoinWorkspace(data);
        break;
      case 'whiteboard-element-add':
        this.handleAddElement(data);
        break;
      case 'whiteboard-element-update':
        this.handleUpdateElement(data);
        break;
      case 'whiteboard-element-delete':
        this.handleDeleteElement(data);
        break;
      case 'whiteboard-clear':
        this.handleClearWhiteboard(data);
        break;
      case 'get-whiteboard':
        this.handleGetWhiteboard(data);
        break;
      default:
        console.log('Unhandled mock socket event:', event);
    }
  }

  handleJoinWorkspace(data) {
    const { workspaceId, userId, username } = data;
    
    // Add user to active users
    if (!this.activeUsers.has(workspaceId)) {
      this.activeUsers.set(workspaceId, new Map());
    }
    
    this.activeUsers.get(workspaceId).set(userId, { username });
    
    // Notify others that user joined
    setTimeout(() => {
      this.triggerEvent('user-joined', {
        workspaceId,
        userId,
        username,
        activeUsers: Array.from(this.activeUsers.get(workspaceId).entries())
      });
    }, 300);
    
    // Initialize whiteboard for this workspace if it doesn't exist
    if (!this.whiteboardElements.has(workspaceId)) {
      this.whiteboardElements.set(workspaceId, []);
    }
    
    // Send whiteboard init event
    setTimeout(() => {
      this.triggerEvent('whiteboard-init', {
        workspaceId,
        elements: this.whiteboardElements.get(workspaceId) || []
      });
    }, 500);
  }

  handleAddElement(data) {
    const { workspaceId, element, userId } = data;
    
    if (!this.whiteboardElements.has(workspaceId)) {
      this.whiteboardElements.set(workspaceId, []);
    }
    
    this.whiteboardElements.get(workspaceId).push(element);
    
    // Notify others about the new element
    setTimeout(() => {
      this.triggerEvent('whiteboard-element-added', {
        workspaceId,
        element,
        userId
      });
    }, 100);
  }

  handleUpdateElement(data) {
    const { workspaceId, elementId, updates, userId } = data;
    
    if (!this.whiteboardElements.has(workspaceId)) return;
    
    const elements = this.whiteboardElements.get(workspaceId);
    const elementIndex = elements.findIndex(el => el.id === elementId);
    
    if (elementIndex !== -1) {
      elements[elementIndex] = { ...elements[elementIndex], ...updates };
      
      // Notify others about the updated element
      setTimeout(() => {
        this.triggerEvent('whiteboard-element-updated', {
          workspaceId,
          elementId,
          updates,
          userId
        });
      }, 100);
    }
  }

  handleDeleteElement(data) {
    const { workspaceId, elementId, userId } = data;
    
    if (!this.whiteboardElements.has(workspaceId)) return;
    
    const elements = this.whiteboardElements.get(workspaceId);
    const filteredElements = elements.filter(el => el.id !== elementId);
    
    this.whiteboardElements.set(workspaceId, filteredElements);
    
    // Notify others about the deleted element
    setTimeout(() => {
      this.triggerEvent('whiteboard-element-deleted', {
        workspaceId,
        elementId,
        userId
      });
    }, 100);
  }

  handleClearWhiteboard(data) {
    const { workspaceId, userId } = data;
    
    this.whiteboardElements.set(workspaceId, []);
    
    // Notify others about the cleared whiteboard
    setTimeout(() => {
      this.triggerEvent('whiteboard-cleared', {
        workspaceId,
        userId
      });
    }, 100);
  }

  handleGetWhiteboard(data) {
    const { workspaceId } = data;
    
    // Send whiteboard init event
    setTimeout(() => {
      this.triggerEvent('whiteboard-init', {
        workspaceId,
        elements: this.whiteboardElements.get(workspaceId) || []
      });
    }, 200);
  }

  triggerEvent(event, data) {
    console.log('Mock socket triggering event:', event, data);
    
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => handler(data));
    }
  }

  joinWorkspace(workspaceId, userId, username) {
    console.log('Mock socket joining workspace:', workspaceId, 'as user:', userId, username);
    
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.username = username;
    
    this.emit('join-workspace', { workspaceId, userId, username });
  }

  addWhiteboardElement(element) {
    if (!this.workspaceId) {
      console.error('Cannot add whiteboard element: workspaceId missing');
      return;
    }
    
    this.emit('whiteboard-element-add', {
      workspaceId: this.workspaceId,
      element,
      userId: this.userId
    });
  }

  updateWhiteboardElement(elementId, updates) {
    if (!this.workspaceId) {
      console.error('Cannot update whiteboard element: workspaceId missing');
      return;
    }
    
    this.emit('whiteboard-element-update', {
      workspaceId: this.workspaceId,
      elementId,
      updates,
      userId: this.userId
    });
  }

  deleteWhiteboardElement(elementId) {
    if (!this.workspaceId) {
      console.error('Cannot delete whiteboard element: workspaceId missing');
      return;
    }
    
    this.emit('whiteboard-element-delete', {
      workspaceId: this.workspaceId,
      elementId,
      userId: this.userId
    });
  }

  clearWhiteboard() {
    if (!this.workspaceId) {
      console.error('Cannot clear whiteboard: workspaceId missing');
      return;
    }
    
    this.emit('whiteboard-clear', {
      workspaceId: this.workspaceId,
      userId: this.userId
    });
  }

  grantAccess(grantedUserId) {
    setTimeout(() => {
      this.triggerEvent('access-granted', {
        workspaceId: this.workspaceId,
        userId: grantedUserId,
        grantedBy: this.userId
      });
      
      toast.success(`Access granted to user`);
    }, 300);
  }

  revokeAccess(revokedUserId) {
    setTimeout(() => {
      this.triggerEvent('access-revoked', {
        workspaceId: this.workspaceId,
        userId: revokedUserId,
        revokedBy: this.userId
      });
      
      toast.info(`Access revoked from user`);
    }, 300);
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  disconnect() {
    console.log('Mock socket disconnected');
    this.connected = false;
    this.workspaceId = null;
    this.userId = null;
    this.username = null;
  }
}

// Create a singleton instance
const mockSocketService = new MockSocketService();

export default mockSocketService; 