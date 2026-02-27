const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    certificateId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Certificate'
    },
    type: {
        type: String,
        enum: ['certificate', 'profile', 'system'],
        default: 'system'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for getting a user's notifications quickly
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
