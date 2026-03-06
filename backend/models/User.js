const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'intern'],
        default: 'intern'
    },
    internRole: {
        type: String,
        enum: ['fullstack', 'frontend', 'backend', 'ai', 'ml', 'datascience']
    },
    internId: {
        type: String,
        unique: true,
        sparse: true
    },
    resetPasswordOtp: {
        type: String
    },
    resetPasswordExpire: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    loginAllowed: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
