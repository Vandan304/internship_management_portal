const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, verifyOtp, resetPassword } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// @route POST /api/auth/register
router.post('/register', register);

// @route POST /api/auth/login
router.post('/login', login);

// @route POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// @route POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// @route GET /api/auth/me
// @desc  Get current logged in user
// @access Private (Protected)
router.get('/me', protect, (req, res) => {
    // The user is attached to req.user by the authMiddleware
    res.status(200).json({
        success: true,
        user: req.user
    });
});


// @route POST /api/auth/update-fcm-token
// @desc  Update user's FCM token for push notifications
// @access Private
router.post('/update-fcm-token', protect, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ success: false, message: 'FCM token is required' });
        }

        req.user.fcmToken = fcmToken;
        await req.user.save();

        res.status(200).json({
            success: true,
            message: 'FCM token updated successfully'
        });
    } catch (error) {
        console.error('[AUTH ERROR] Update FCM token failed:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
