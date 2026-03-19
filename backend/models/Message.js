const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messageText: {
        type: String,
        trim: true
    },
    encryptedMessage: {
        type: String
    },
    iv: {
        type: String
    },
    algorithm: {
        type: String,
        default: 'aes-256-cbc'
    },
    fileUrl: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
