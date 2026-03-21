const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['today', 'tomorrow', '2day'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    sentAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound index for duplicate prevention: userId + taskId + type + scheduledTime (date part)
notificationSchema.index({ userId: 1, taskId: 1, type: 1, scheduledTime: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);
