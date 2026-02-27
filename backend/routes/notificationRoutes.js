const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead } = require('../controllers/notificationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Apply protection to all notification routes
router.use(protect);

// Intern-only route (technically admin could have notifications, but we restrict it based on requirements)
router.get('/my-notifications', authorizeRoles('intern'), getMyNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;
