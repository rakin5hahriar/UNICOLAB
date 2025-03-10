import { io } from 'socket.io-client';

class CollaborationService {
    constructor() {
        this.socket = null;
        this.callbacks = {
            onUserJoined: () => {},
            onUserLeft: () => {},
            onContentUpdated: () => {},
            onCommentAdded: () => {},
            onCursorMoved: () => {},
        };
    }

    connect() {
        if (this.socket) return;

        this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            transports: ['websocket'],
            autoConnect: true
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.socket.on('user-joined', (data) => {
            this.callbacks.onUserJoined(data);
        });

        this.socket.on('user-left', (data) => {
            this.callbacks.onUserLeft(data);
        });

        this.socket.on('content-updated', (data) => {
            this.callbacks.onContentUpdated(data);
        });

        this.socket.on('comment-added', (data) => {
            this.callbacks.onCommentAdded(data);
        });

        this.socket.on('cursor-moved', (data) => {
            this.callbacks.onCursorMoved(data);
        });
    }

    joinWorkspace(workspaceId, userId, username) {
        if (!this.socket) this.connect();
        this.socket.emit('join-workspace', { workspaceId, userId, username });
    }

    leaveWorkspace(workspaceId) {
        if (this.socket) {
            this.socket.emit('leave-workspace', { workspaceId });
        }
    }

    updateContent(workspaceId, change, userId) {
        if (this.socket) {
            this.socket.emit('content-change', { workspaceId, change, userId });
        }
    }

    addComment(workspaceId, comment, userId) {
        if (this.socket) {
            this.socket.emit('add-comment', { workspaceId, comment, userId });
        }
    }

    updateCursorPosition(workspaceId, position, userId) {
        if (this.socket) {
            this.socket.emit('cursor-move', { workspaceId, position, userId });
        }
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

const collaborationService = new CollaborationService();
export default collaborationService; 