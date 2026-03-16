const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    internId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resourceType: {
        type: String,
        required: true,
        enum: ['certificate', 'offerletter']
    },
    resourceName: {
        type: String,
        required: true
    },
    resourcePath: {
        type: String,
        required: true
    },
    visibilityEnabled: {
        type: Boolean,
        default: false
    },
    downloadEnabled: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
permissionSchema.index({ internId: 1, resourceType: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
