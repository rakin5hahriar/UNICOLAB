const { Server } = require('socket.io');

class CollaborationService {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ['GET', 'POST']
            }
        });
        
        this.activeUsers = new Map(); // Store active users by workspace
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            // Handle joining a workspace
            socket.on('join-workspace', ({ workspaceId, userId, username }) => {
                socket.join(workspaceId);
                
                if (!this.activeUsers.has(workspaceId)) {
                    this.activeUsers.set(workspaceId, new Map());
                }
                
                this.activeUsers.get(workspaceId).set(userId, {
                    socketId: socket.id,
                    username,
                    lastActive: new Date()
                });

                // Broadcast to others in the workspace
                this.io.to(workspaceId).emit('user-joined', {
                    userId,
                    username,
                    activeUsers: Array.from(this.activeUsers.get(workspaceId).entries())
                });
            });

            // Handle real-time content updates
            socket.on('content-change', ({ workspaceId, change, userId }) => {
                socket.to(workspaceId).emit('content-updated', {
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
                socket.to(workspaceId).emit('cursor-moved', {
                    userId,
                    position
                });
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                for (const [workspaceId, users] of this.activeUsers.entries()) {
                    for (const [userId, user] of users.entries()) {
                        if (user.socketId === socket.id) {
                            users.delete(userId);
                            this.io.to(workspaceId).emit('user-left', { userId });
                            break;
                        }
                    }
                }
            });
        });
    }
}

module.exports = CollaborationService; 