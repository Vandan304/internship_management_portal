const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a certificate title'],
        trim: true
    },
    fileUrl: {
        type: String,
        required: [true, 'Please provide the file URL']
    },
    fileName: {
        type: String,
        required: [true, 'Please provide the file name']
    },
    uploadedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    canDownload: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for faster queries
certificateSchema.index({ assignedTo: 1 });
certificateSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
