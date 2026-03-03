const mongoose = require('mongoose');

const certificatePermissionSchema = new mongoose.Schema({
    certificate: {
        type: mongoose.Schema.ObjectId,
        ref: 'Certificate',
        required: true
    },
    intern: {
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
    assignedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for faster lookups
certificatePermissionSchema.index({ intern: 1 });
certificatePermissionSchema.index({ certificate: 1 });
// Ensure unique combination of intern and certificate
certificatePermissionSchema.index({ certificate: 1, intern: 1 }, { unique: true });

module.exports = mongoose.model('CertificatePermission', certificatePermissionSchema);
