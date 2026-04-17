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


module.exports = router;
