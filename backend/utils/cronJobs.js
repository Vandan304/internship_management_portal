const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendDeadlineNotification } = require('./notificationService');
const { sendPushNotification } = require('./firebaseService');

/**
 * 1. Populate the Notification Queue
 * Scans tasks and creates pending notification records if they don't exist.
 */
const runDeadlineAudit = async () => {
    console.log(`[CRON] ${new Date().toISOString()} - Starting task deadline audit to populate queue...`);
    
    try {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        
        const getDayRange = (daysFromNow) => {
            const start = new Date(todayStart);
            start.setDate(todayStart.getDate() + daysFromNow);
            const end = new Date(todayEnd);
            end.setDate(todayEnd.getDate() + daysFromNow);
            return { start, end };
        };

        const tomorrow = getDayRange(1);
        const inTwoDays = getDayRange(2);

        const auditConfigs = [
            { start: new Date(0), end: new Date(todayStart.getTime() - 1), type: 'overdue', message: 'You missed the deadline' },
            { start: todayStart, end: todayEnd, type: 'today', message: 'Task is due today' },
            { start: tomorrow.start, end: tomorrow.end, type: 'tomorrow', message: 'Task is due tomorrow' },
            { start: inTwoDays.start, end: inTwoDays.end, type: '2day', message: 'Task is due in 2 days' }
        ];

        let createdCount = 0;

        for (const config of auditConfigs) {
            const tasks = await Task.find({
                status: 'pending',
                deadline: { $gte: config.start, $lte: config.end }
            }).populate('assignedTo');

            for (const task of tasks) {
                if (!task.assignedTo) continue;

                if (config.type === 'overdue') {
                    // Overdue logic requested by user:
                    if (task.overdueNotified) continue;

                    // Extra check in Notification collection as requested (optional safety net)
                    const existing = await Notification.findOne({
                        userId: task.assignedTo._id,
                        taskId: task._id,
                        type: 'overdue'
                    });

                    if (!existing) {
                        await Notification.create({
                            userId: task.assignedTo._id,
                            taskId: task._id,
                            message: `${config.message}: ${task.title}`,
                            type: 'overdue',
                            scheduledTime: now,
                            status: 'pending'
                        });
                        createdCount++;
                    }

                    // Ensure task flag is set to true immediately
                    task.overdueNotified = true;
                    await task.save();
                } else {
                    // Duplicate Prevention for standard reminders: check specific day
                    const existing = await Notification.findOne({
                        userId: task.assignedTo._id,
                        taskId: task._id,
                        type: config.type,
                        scheduledTime: { $gte: todayStart, $lte: todayEnd }
                    });

                    if (!existing) {
                        await Notification.create({
                            userId: task.assignedTo._id,
                            taskId: task._id,
                            message: `${config.message}: ${task.title}`,
                            type: config.type,
                            scheduledTime: now,
                            status: 'pending'
                        });
                        createdCount++;
                    }
                }
            }
        }

        console.log(`[CRON] Audit complete. Created ${createdCount} new pending notifications.`);
        // After populating, trigger processing
        await processPendingNotifications();
        
        return { success: true, created: createdCount };
    } catch (error) {
        console.error('[CRON ERROR] Deadline audit failed:', error);
        throw error;
    }
};

/**
 * 2. Process the Notification Queue
 * Sends pending notifications via Email and Push.
 */
const processPendingNotifications = async () => {
    console.log(`[CRON] ${new Date().toISOString()} - Processing pending notifications...`);
    
    try {
        const pending = await Notification.find({
            status: 'pending',
            scheduledTime: { $lte: new Date() }
        }).populate({
            path: 'userId',
            select: 'name email fcmToken'
        }).populate({
            path: 'taskId',
            select: 'title deadline'
        });

        console.log(`[CRON] Found ${pending.length} notifications to send.`);

        for (const note of pending) {
            try {
                const user = note.userId;
                const task = note.taskId;

                if (!user || !task) {
                    note.status = 'failed';
                    await note.save();
                    continue;
                }

                // A) Send Email (Nodemailer)
                let emailSent = false;
                try {
                    await sendDeadlineNotification(
                        user.email,
                        user.name,
                        task.title,
                        task.deadline,
                        note.type === '2day' ? '2-days' : note.type,
                        { userId: user._id, taskId: task._id } // Pass metadata for logging
                    );
                    emailSent = true;
                } catch (err) {
                    console.error(`[CRON] Email failed for ${user.email}:`, err.stack || err.message);
                }

                // B) Send Push (Firebase)
                if (user.fcmToken) {
                    try {
                        await sendPushNotification(
                            user.fcmToken,
                            note.type === 'today' ? '🚨 Task Due Today' : '📅 Task Reminder',
                            note.message,
                            { userId: user._id, taskId: task._id, type: note.type } // Pass metadata for logging
                        );
                    } catch (err) {
                        console.error(`[CRON] Push failed for ${user.email}:`, err.message);
                    }
                }

                // Mark as sent regardless of individual failures (to avoid double sending)
                // In a true production environment, we might retry failures.
                note.status = 'sent';
                note.sentAt = new Date();
                await note.save();

            } catch (innerError) {
                console.error('[CRON ERROR] Failed to process notification:', innerError);
            }
        }
    } catch (error) {
        console.error('[CRON ERROR] Process pending notifications failed:', error);
    }
};

/**
 * 3. Recovery Logic (Server Start)
 * Runs both the audit (to find new tasks if 9am was missed)
 * and the processing (to send anything pending).
 */
const processMissedNotifications = async () => {
    console.log('[RECOVERY] Checking for missed notifications on server start...');
    // 1. Run audit first to ensure today's notifications are created if missed
    await runDeadlineAudit();
    // 2. Process all pending notifications
    await processPendingNotifications();
};

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
    // Schedule daily audit at 09:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log(`[CRON TRIGGER] ${new Date().toISOString()} - 9:00 AM Daily Audit trigger`);
        await runDeadlineAudit();
    });

    // Optional: Regular check for any pending notifications every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        console.log(`[CRON TRIGGER] ${new Date().toISOString()} - 30m Notification Process trigger`);
        await processPendingNotifications();
    });

    console.log(`[CRON] ${new Date().toISOString()} - Notification queue and deadline service initialized.`);
};

module.exports = { initCronJobs, runDeadlineAudit, processPendingNotifications, processMissedNotifications };
