const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/errorMiddleware');

// Apply protection to all notification routes
router.use(protect);

const { sendDeadlineNotification } = require('../utils/notificationService');

// Intern-only route
router.get('/', authorizeRoles('intern'), getMyNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', validateObjectId, markAsRead);

// Admin-only test route for production debugging
router.post('/send-test-email', authorizeRoles('admin'), async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        console.log(`[TEST EMAIL] Manually triggering test email to: ${email}`);
        await sendDeadlineNotification(
            email,
            "Test Admin",
            "Production Debug Task",
            new Date(),
            "assigned",
            { test: true }
        );
        res.status(200).json({ message: "Test email trigger successful. Check server logs for result." });
    } catch (error) {
        res.status(500).json({ message: "Failed to trigger test email", error: error.message });
    }
});

module.exports = router;
