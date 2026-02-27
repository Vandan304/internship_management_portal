const Notification = require('../models/Notification');

// @route   GET /api/notifications/my-notifications
// @desc    Get all notifications for the logged in intern
// @access  Private/Intern
exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.id
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (notification.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ success: true, data: notification });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all unread notifications as read
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error updating notifications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
