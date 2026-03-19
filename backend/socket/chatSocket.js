/**
 * Socket.io events for the Chat module
 * Handles connections, rooms, and real-time messaging
 */
const chatSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected to Chat:', socket.id);

        // User specific room for global notifications
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(userId);
                console.log(`[Socket] User ${userId} joined their notification room`);
            }
        });

        // Active conversation room for real-time messages
        socket.on('joinConversation', (conversationId) => {
            if (conversationId) {
                // Leave previous conversation rooms if any? 
                // Using socket.join is additive, which is fine for multi-tab
                socket.join(conversationId);
                console.log(`[Socket] Client ${socket.id} joined conversation: ${conversationId}`);
            }
        });

        // Sending a message
        socket.on('sendMessage', (message) => {
            if (!message) return;

            console.log(`[Socket] New message in ${message.conversationId} from ${message.senderId?._id || message.senderId}`);

            // 1. Send to the conversation room (for everyone currently viewing the chat)
            if (message.conversationId) {
                io.to(message.conversationId).emit('receiveMessage', message);
            }

            // 2. Send as a notification to the receiver room (for the toast notification if they aren't in this chat)
            const receiverId = message.receiverId?._id || message.receiverId;
            if (receiverId) {
                // We use socket.to(receiverId) to send it to the receiver but NOT the sender
                // However, the sender already has it in their UI from the axios response.
                socket.to(receiverId).emit('newMessageNotification', message);
            }
        });

        // Real-time typing status
        socket.on('typing', ({ conversationId, senderId, isTyping }) => {
            if (conversationId) {
                socket.to(conversationId).emit('typingIndicator', { senderId, isTyping });
            }
        });

        // Message read status sync
        socket.on('messageRead', ({ messageId, conversationId }) => {
            if (conversationId) {
                socket.to(conversationId).emit('messageReadConfirmation', { messageId });
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

module.exports = chatSocket;
