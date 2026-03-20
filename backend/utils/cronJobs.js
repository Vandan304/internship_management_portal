const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendDeadlineNotification } = require('./notificationService');

/**
 * Main logic to find tasks due today/tomorrow/2-days and send emails
 */
const runDeadlineAudit = async () => {
    console.log('[CRON] Starting task deadline audit...');
    
    try {
        const now = new Date();
        
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        
        // Helper to get day ranges
        const getDayRange = (daysFromNow) => {
            const start = new Date(todayStart);
            start.setDate(todayStart.getDate() + daysFromNow);
            const end = new Date(todayEnd);
            end.setDate(todayEnd.getDate() + daysFromNow);
            return { start, end };
        };

        const tomorrow = getDayRange(1);
        const inTwoDays = getDayRange(2);

        console.log(`[CRON] Auditing deadlines. Today: ${todayStart.toISOString()}, Tomorrow: ${tomorrow.start.toISOString()}, 2-Days: ${inTwoDays.start.toISOString()}`);

        const scanAndNotify = async (start, end, urgency) => {
            const tasks = await Task.find({
                status: 'pending',
                deadline: { $gte: start, $lte: end }
            }).populate('assignedTo');

            console.log(`[CRON] Found ${tasks.length} tasks for ${urgency}.`);
            for (const task of tasks) {
                if (task.assignedTo && task.assignedTo.email) {
                    await sendDeadlineNotification(
                        task.assignedTo.email,
                        task.assignedTo.name,
                        task.title,
                        task.deadline,
                        urgency
                    );
                }
            }
            return tasks.length;
        };

        // 1. Overdue or Due Today
        const overdueCount = await scanAndNotify(new Date(0), todayEnd, 'today');

        // 2. Due Tomorrow
        const tomorrowCount = await scanAndNotify(tomorrow.start, tomorrow.end, 'tomorrow');

        // 3. Due in 2 Days
        const twoDaysCount = await scanAndNotify(inTwoDays.start, inTwoDays.end, '2-days');

        return { 
            success: true, 
            summary: {
                todayOrOverdue: overdueCount,
                tomorrow: tomorrowCount,
                inTwoDays: twoDaysCount
            }
        };
    } catch (error) {
        console.error('[CRON ERROR] Error occurred during deadline audit:', error);
        throw error;
    }
};

/**
 * Initialize all cron jobs for the application
 */
const initCronJobs = () => {
    // Schedule deadline reminders to run at 09:00 AM every day
    cron.schedule('0 9 * * *', async () => {
        await runDeadlineAudit();
    });

    console.log('[CRON] Task deadline notifications service initialized.');
};

module.exports = { initCronJobs, runDeadlineAudit };
