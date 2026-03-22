const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
        // removed required: true
    },
    certificateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certificate'
    },
    title: {
        type: String
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    scheduledTime: {
        type: Date
        // removed required: true
    },
    type: {
        type: String,
        required: true
        // removed enum to allow 'system', 'certificate', 'assigned', etc.
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

const Notification = mongoose.model('Notification', notificationSchema);

// Drop the old unique index that required scheduledTime and taskId
Notification.collection.dropIndex('userId_1_taskId_1_type_1_scheduledTime_1').catch(err => {
    // Ignore error if index doesn't exist
});

module.exports = Notification;
