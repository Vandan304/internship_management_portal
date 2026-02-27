const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Apply protection to all notification routes
router.use(protect);

// Intern-only route
router.get('/', authorizeRoles('intern'), getMyNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
