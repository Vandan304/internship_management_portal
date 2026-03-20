const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a task title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a task description']
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    weekNumber: {
        type: Number,
        required: [true, 'Please specify the week number']
    },
    deadline: {
        type: Date,
        required: [true, 'Please specify a deadline']
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'approved', 'rejected'],
        default: 'pending'
    },
    zipFile: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    storageType: {
        type: String,
        enum: ['s3', 'local'],
        default: 's3'
    },
    submittedAt: {
        type: Date,
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    reviewComment: {
        type: String,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    pointsAwarded: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes to improve query performance on common fields
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Task', taskSchema);
