const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// @route POST /api/auth/register
router.post('/register', register);

// @route POST /api/auth/login
router.post('/login', login);

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

// @route GET /api/auth/admin-only
// @desc  Test route for admin access only
// @access Private/Admin
router.get('/admin-only', protect, authorizeRoles('admin'), (req, res) => {
    res.status(200).json({
        success: true,
        message: 'You have accessed the admin-only route successfully.',
        user: req.user
    });
});

module.exports = router;
