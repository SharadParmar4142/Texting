const socketIo = require('socket.io');

let io;
const userDeviceTokens = new Map();
const listenerDeviceTokens = new Map();

module.exports = {
    init: (server) => {
        io = socketIo(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('register-user', ({ userId, deviceToken }) => {
                userDeviceTokens.set(userId, deviceToken);
                console.log(`User registered: ${userId} with device token: ${deviceToken}`);
            });

            socket.on('register-listener', ({ listenerId, deviceToken }) => {
                listenerDeviceTokens.set(listenerId, deviceToken);
                console.log(`Listener registered: ${listenerId} with device token: ${deviceToken}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                // Remove device tokens from maps if needed
                userDeviceTokens.forEach((value, key) => {
                    if (value === socket.id) {
                        userDeviceTokens.delete(key);
                    }
                });
                listenerDeviceTokens.forEach((value, key) => {
                    if (value === socket.id) {
                        listenerDeviceTokens.delete(key);
                    }
                });
            });

            socket.on('connect_error', (err) => {
                console.error('Connection error:', err);
            });

            socket.on('reconnect', (attemptNumber) => {
                console.log('Reconnected after', attemptNumber, 'attempts');
            });

            // Listen for a specific event to send a message to another client
            socket.on('send-message', ({ recipientId, message }) => {
                console.log(`Message from ${socket.id} to ${recipientId}: ${message}`);

                // Send the message to the specified socket ID
                io.to(recipientId).emit('receive-message', {
                    senderId: socket.id,
                    message,
                });
            });
        });

        return io;
    },
    getIo: () => {  
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    },
    getUserDeviceToken: (userId) => {
        return userDeviceTokens.get(userId);
    },
    getListenerDeviceToken: (listenerId) => {
        return listenerDeviceTokens.get(listenerId);
    }
};