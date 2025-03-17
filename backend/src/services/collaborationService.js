const { Server } = require('socket.io');

class CollaborationService {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                credentials: true,
                allowedHeaders: ['Content-Type', 'Authorization']
            }
        });
        
        this.activeUsers = new Map(); // Store active users by workspace
        this.whiteboardData = new Map(); // Store whiteboard data by workspace
        this.textEditorData = new Map(); // Store text editor data by workspace
        this.typingUsers = new Map(); // Store users who are currently typing
        this.accessControl = new Map(); // Store access control by workspace
        this.userJoinTimestamps = new Map(); // Track user join timestamps to prevent rapid reconnects
        this.joinThrottleTime = 2000; // 2 seconds between join attempts
        
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            // Reduce connection logging
            // console.log('User connected:', socket.id);
            
            // Track user join timestamps to prevent rapid reconnects
            const userJoinTimestamps = new Map();
            const joinThrottleTime = 2000; // 2 seconds between join attempts

            // Handle joining a workspace
            socket.on('join-workspace', ({ workspaceId, userId, username }) => {
                // Check if this user has recently joined this workspace
                const userKey = `${workspaceId}:${userId}`;
                const lastJoinTime = this.userJoinTimestamps.get(userKey) || 0;
                const now = Date.now();
                
                if (now - lastJoinTime < this.joinThrottleTime) {
                    // Reduce throttling logging
                    // console.log(`Throttling join request for user ${username} (${userId}) to workspace ${workspaceId}`);
                    // Don't join again, but still send the current state to avoid UI issues
                    this.sendCurrentState(socket, workspaceId, userId);
                    return;
                }
                
                // Update the timestamp for this user
                this.userJoinTimestamps.set(userKey, now);
                
                // Reduce join logging
                // console.log(`User ${username} (${userId}) joining workspace ${workspaceId}`);
                socket.join(workspaceId);
                
                // Check if user is already in the workspace
                if (this.activeUsers.has(workspaceId) && 
                    this.activeUsers.get(workspaceId).has(userId)) {
                    
                    // Update the socket ID and last active time
                    const userData = this.activeUsers.get(workspaceId).get(userId);
                    userData.socketId = socket.id;
                    userData.lastActive = new Date();
                    
                    // Reduce reconnect logging
                    // console.log(`User ${username} (${userId}) reconnected to workspace ${workspaceId}`);
                } else {
                    // Add new user to the workspace
                    if (!this.activeUsers.has(workspaceId)) {
                        this.activeUsers.set(workspaceId, new Map());
                    }
                    
                    this.activeUsers.get(workspaceId).set(userId, {
                        socketId: socket.id,
                        username,
                        lastActive: new Date()
                    });
                }

                // Initialize whiteboard data if it doesn't exist
                if (!this.whiteboardData.has(workspaceId)) {
                    // Reduce initialization logging
                    // console.log(`Initializing empty whiteboard for workspace ${workspaceId}`);
                    this.whiteboardData.set(workspaceId, []);
                }

                // Initialize text editor data if it doesn't exist
                if (!this.textEditorData.has(workspaceId)) {
                    // Reduce initialization logging
                    // console.log(`Initializing empty text editor for workspace ${workspaceId}`);
                    this.textEditorData.set(workspaceId, { content: '', lastUpdated: new Date() });
                }

                // Initialize typing users if it doesn't exist
                if (!this.typingUsers.has(workspaceId)) {
                    this.typingUsers.set(workspaceId, new Map());
                }

                // Send current whiteboard data to the joining user
                console.log(`Sending whiteboard data to user ${userId} (${this.whiteboardData.get(workspaceId).length} elements)`);
                socket.emit('whiteboard-init', {
                    elements: this.whiteboardData.get(workspaceId)
                });

                // Send current text editor data to the joining user
                console.log(`Sending text editor data to user ${userId}`);
                socket.emit('text-editor-init', {
                    content: this.textEditorData.get(workspaceId).content,
                    lastUpdated: this.textEditorData.get(workspaceId).lastUpdated
                });

                // Broadcast to all clients in the workspace, including the sender
                this.io.to(workspaceId).emit('user-joined', {
                    userId,
                    username,
                    activeUsers: Array.from(this.activeUsers.get(workspaceId).entries())
                });
            });

            // Handle real-time content updates
            socket.on('content-change', ({ workspaceId, change, userId }) => {
                this.io.to(workspaceId).emit('content-updated', {
                    change,
                    userId
                });
            });

            // Handle comments
            socket.on('add-comment', ({ workspaceId, comment, userId }) => {
                this.io.to(workspaceId).emit('comment-added', {
                    comment,
                    userId,
                    timestamp: new Date()
                });
            });

            // Handle cursor position updates
            socket.on('cursor-move', ({ workspaceId, position, userId }) => {
                this.io.to(workspaceId).emit('cursor-moved', {
                    userId,
                    position
                });
            });

            // Handle whiteboard element creation
            socket.on('whiteboard-element-add', ({ workspaceId, element, userId }) => {
                console.log(`Whiteboard element added by ${userId} in workspace ${workspaceId}`);
                
                if (!element || !element.id) {
                    console.error(`Invalid element data received from ${userId}`);
                    return;
                }
                
                if (this.whiteboardData.has(workspaceId)) {
                    // Check for duplicates
                    const elements = this.whiteboardData.get(workspaceId);
                    const existingIndex = elements.findIndex(el => el.id === element.id);
                    
                    if (existingIndex !== -1) {
                        console.log(`Duplicate element ${element.id} detected, not adding`);
                    } else {
                        this.whiteboardData.get(workspaceId).push(element);
                        console.log(`Added element ${element.id} to workspace ${workspaceId}`);
                        
                        // Broadcast to all clients in the workspace, including the sender
                        this.io.to(workspaceId).emit('whiteboard-element-added', {
                            element,
                            userId
                        });
                    }
                } else {
                    console.error(`Workspace ${workspaceId} not found for whiteboard element add`);
                }
            });

            // Handle whiteboard element update
            socket.on('whiteboard-element-update', ({ workspaceId, elementId, updates, userId }) => {
                console.log(`Whiteboard element updated by ${userId} in workspace ${workspaceId}`);
                
                if (this.whiteboardData.has(workspaceId)) {
                    const elements = this.whiteboardData.get(workspaceId);
                    const elementIndex = elements.findIndex(el => el.id === elementId);
                    
                    if (elementIndex !== -1) {
                        elements[elementIndex] = { ...elements[elementIndex], ...updates };
                        
                        // Broadcast to all clients in the workspace, including the sender
                        this.io.to(workspaceId).emit('whiteboard-element-updated', {
                            elementId,
                            updates,
                            userId
                        });
                    }
                }
            });

            // Handle whiteboard element deletion
            socket.on('whiteboard-element-delete', ({ workspaceId, elementId, userId }) => {
                console.log(`Whiteboard element deleted by ${userId} in workspace ${workspaceId}`);
                
                if (this.whiteboardData.has(workspaceId)) {
                    const elements = this.whiteboardData.get(workspaceId);
                    const elementIndex = elements.findIndex(el => el.id === elementId);
                    
                    if (elementIndex !== -1) {
                        elements.splice(elementIndex, 1);
                        
                        // Broadcast to all clients in the workspace, including the sender
                        this.io.to(workspaceId).emit('whiteboard-element-deleted', {
                            elementId,
                            userId
                        });
                    }
                }
            });

            // Handle whiteboard clear
            socket.on('whiteboard-clear', ({ workspaceId, userId }) => {
                console.log(`Whiteboard cleared by ${userId} in workspace ${workspaceId}`);
                
                if (this.whiteboardData.has(workspaceId)) {
                    this.whiteboardData.set(workspaceId, []);
                    
                    // Broadcast to all clients in the workspace, including the sender
                    this.io.to(workspaceId).emit('whiteboard-cleared', {
                        userId
                    });
                }
            });

            // Handle text editor updates
            socket.on('text-editor-update', ({ workspaceId, userId, username, content, timestamp }) => {
                console.log(`Text editor update from ${username} (${userId}) in workspace ${workspaceId}`);
                
                if (!content) {
                    console.error(`Invalid content received from ${userId}`);
                    return;
                }
                
                if (this.textEditorData.has(workspaceId)) {
                    this.textEditorData.set(workspaceId, { 
                        content, 
                        lastUpdated: timestamp || new Date() 
                    });
                    
                    // Broadcast to all clients in the workspace, including the sender
                    this.io.to(workspaceId).emit('text-editor-update', {
                        content,
                        userId,
                        username,
                        timestamp: timestamp || new Date()
                    });
                } else {
                    console.log(`Creating text editor data for workspace ${workspaceId}`);
                    this.textEditorData.set(workspaceId, { 
                        content, 
                        lastUpdated: timestamp || new Date() 
                    });
                    
                    this.io.to(workspaceId).emit('text-editor-update', {
                        content,
                        userId,
                        username,
                        timestamp: timestamp || new Date()
                    });
                }
            });

            // Handle text editor selection updates
            socket.on('text-editor-selection', ({ workspaceId, userId, username, selection, timestamp }) => {
                this.io.to(workspaceId).emit('text-editor-selection', {
                    selection,
                    userId,
                    username,
                    timestamp: timestamp || new Date()
                });
            });

            // Handle typing status updates
            socket.on('text-editor-typing', ({ workspaceId, userId, username, isTyping, timestamp }) => {
                if (this.typingUsers.has(workspaceId)) {
                    if (isTyping) {
                        this.typingUsers.get(workspaceId).set(userId, {
                            username,
                            timestamp: timestamp || new Date()
                        });
                    } else {
                        this.typingUsers.get(workspaceId).delete(userId);
                    }
                    
                    this.io.to(workspaceId).emit('text-editor-typing', {
                        userId,
                        username,
                        isTyping,
                        timestamp: timestamp || new Date()
                    });
                }
            });

            // Handle text editor content request
            socket.on('text-editor-request-content', ({ workspaceId, userId }) => {
                console.log(`Text editor content requested by ${userId} for workspace ${workspaceId}`);
                
                if (this.textEditorData.has(workspaceId)) {
                    console.log(`Sending text editor content for workspace ${workspaceId}`);
                    socket.emit('text-editor-init', {
                        content: this.textEditorData.get(workspaceId).content,
                        lastUpdated: this.textEditorData.get(workspaceId).lastUpdated
                    });
                } else {
                    console.log(`No text editor content for workspace ${workspaceId}, initializing empty`);
                    this.textEditorData.set(workspaceId, { content: '', lastUpdated: new Date() });
                    socket.emit('text-editor-init', {
                        content: '',
                        lastUpdated: new Date()
                    });
                }
            });
            
            // Handle text editor metadata updates (title, etc.)
            socket.on('text-editor-metadata', ({ workspaceId, userId, username, metadata, timestamp }) => {
                console.log(`Text editor metadata update from ${username} (${userId}) in workspace ${workspaceId}:`, metadata);
                
                if (!metadata) {
                    console.error(`Invalid metadata received from ${userId}`);
                    return;
                }
                
                if (this.textEditorData.has(workspaceId)) {
                    // Update existing data with metadata
                    const currentData = this.textEditorData.get(workspaceId);
                    this.textEditorData.set(workspaceId, { 
                        ...currentData,
                        ...metadata,
                        lastUpdated: timestamp || new Date() 
                    });
                    
                    // Broadcast to all clients in the workspace, including the sender
                    this.io.to(workspaceId).emit('text-editor-metadata', {
                        metadata,
                        userId,
                        username,
                        timestamp: timestamp || new Date()
                    });
                } else {
                    console.log(`Creating text editor data with metadata for workspace ${workspaceId}`);
                    this.textEditorData.set(workspaceId, { 
                        content: '',
                        ...metadata,
                        lastUpdated: timestamp || new Date() 
                    });
                    
                    this.io.to(workspaceId).emit('text-editor-metadata', {
                        metadata,
                        userId,
                        username,
                        timestamp: timestamp || new Date()
                    });
                }
            });

            // Handle access control
            socket.on('grant-access', ({ workspaceId, grantedUserId, grantedBy }) => {
                if (!this.accessControl.has(workspaceId)) {
                    this.accessControl.set(workspaceId, new Set());
                }
                
                this.accessControl.get(workspaceId).add(grantedUserId);
                
                this.io.to(workspaceId).emit('access-granted', {
                    userId: grantedUserId,
                    grantedBy
                });
            });

            socket.on('revoke-access', ({ workspaceId, revokedUserId, revokedBy }) => {
                if (this.accessControl.has(workspaceId)) {
                    this.accessControl.get(workspaceId).delete(revokedUserId);
                    
                    this.io.to(workspaceId).emit('access-revoked', {
                        userId: revokedUserId,
                        revokedBy
                    });
                }
            });

            // WebRTC signaling for video/audio calls
            socket.on('webrtc-offer', ({ workspaceId, offer, targetUserId, fromUserId }) => {
                const targetUser = this.findUserInWorkspace(workspaceId, targetUserId);
                
                if (targetUser) {
                    this.io.to(targetUser.socketId).emit('webrtc-offer', {
                        offer,
                        fromUserId
                    });
                }
            });

            socket.on('webrtc-answer', ({ workspaceId, answer, targetUserId, fromUserId }) => {
                const targetUser = this.findUserInWorkspace(workspaceId, targetUserId);
                
                if (targetUser) {
                    this.io.to(targetUser.socketId).emit('webrtc-answer', {
                        answer,
                        fromUserId
                    });
                }
            });

            socket.on('webrtc-ice-candidate', ({ workspaceId, candidate, targetUserId, fromUserId }) => {
                const targetUser = this.findUserInWorkspace(workspaceId, targetUserId);
                
                if (targetUser) {
                    this.io.to(targetUser.socketId).emit('webrtc-ice-candidate', {
                        candidate,
                        fromUserId
                    });
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                for (const [workspaceId, users] of this.activeUsers.entries()) {
                    for (const [userId, user] of users.entries()) {
                        if (user.socketId === socket.id) {
                            users.delete(userId);
                            
                            // Remove from typing users if they were typing
                            if (this.typingUsers.has(workspaceId)) {
                                this.typingUsers.get(workspaceId).delete(userId);
                            }
                            
                            this.io.to(workspaceId).emit('user-left', { userId });
                            break;
                        }
                    }
                }
            });
        });
    }

    findUserInWorkspace(workspaceId, userId) {
        if (this.activeUsers.has(workspaceId)) {
            return this.activeUsers.get(workspaceId).get(userId);
        }
        return null;
    }

    // Helper method to send current state to a user without rejoining
    sendCurrentState(socket, workspaceId, userId) {
        // Send whiteboard data
        if (this.whiteboardData.has(workspaceId)) {
            const elements = this.whiteboardData.get(workspaceId);
            // Reduce logging
            // console.log(`Sending whiteboard data to user ${userId} (${elements.length} elements) - throttled`);
            socket.emit('whiteboard-init', { elements });
        }
        
        // Send text editor data
        if (this.textEditorData.has(workspaceId)) {
            const editorData = this.textEditorData.get(workspaceId);
            // Reduce logging
            // console.log(`Sending text editor data to user ${userId} - throttled`);
            socket.emit('text-editor-init', editorData);
        }
        
        // Send active users
        if (this.activeUsers.has(workspaceId)) {
            const users = Array.from(this.activeUsers.get(workspaceId).entries()).map(([id, data]) => ({
                id,
                username: data.username,
                lastActive: data.lastActive
            }));
            socket.emit('active-users', { users });
        }
    }
}

module.exports = CollaborationService; 