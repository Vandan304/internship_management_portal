const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * AWS Service-style HTML Email Template
 */
const getEmailTemplate = (title, internName, taskTitle, deadline, type) => {
    const isToday = type === 'today';
    const isTomorrow = type === 'tomorrow';
    
    let urgencyText = 'UPCOMING';
    let accentColor = '#232f3e'; // AWS Navy (Default)
    let timingWord = 'soon';

    if (isToday) {
        urgencyText = 'TODAY';
        accentColor = '#ec7211'; // AWS Orange
        timingWord = 'today';
    } else if (isTomorrow) {
        urgencyText = 'TOMORROW';
        accentColor = '#007eb9'; // AWS Blue
        timingWord = 'tomorrow';
    } else if (type === '2-days') {
        urgencyText = '2 DAYS REMAIN';
        accentColor = '#232f3e'; // AWS Navy
        timingWord = 'in 2 days';
    } else if (type === 'assigned') {
        urgencyText = 'NEW ASSIGNMENT';
        accentColor = '#1fb2a6'; // Success Teal
        timingWord = 'by the date shown below';
    } else if (type === 'overdue') {
        urgencyText = 'OVERDUE';
        accentColor = '#d13212'; // AWS Red
        timingWord = 'in the past and is now overdue';
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Amazon Ember', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f2f3f3; margin: 0; padding: 0; color: #16191f; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 2px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12); border-top: 4px solid ${accentColor}; }
        .header { padding: 30px 40px; background-color: #ffffff; }
        .logo img { height: 120px; display: block; }
        .content { padding: 40px; border-top: 1px solid #eaeded; }
        .title { font-size: 22px; font-weight: 700; color: #16191f; margin-bottom: 24px; line-height: 1.2; }
        .message { font-size: 16px; line-height: 24px; color: #545b64; margin-bottom: 30px; }
        .task-box { background-color: #f8f9fa; padding: 25px; border-radius: 4px; border-left: 4px solid #eaeded; margin-bottom: 30px; }
        .task-label { font-size: 12px; font-weight: 700; color: #879596; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .task-value { font-size: 18px; font-weight: 700; color: #16191f; margin-bottom: 16px; }
        .deadline { color: ${accentColor}; font-weight: 700; }
        .button { display: inline-block; background-color: #ec7211; color: #ffffff !important; padding: 12px 25px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 2px; text-transform: uppercase; }
        .footer { padding: 30px 40px; background-color: #f2f3f3; color: #879596; font-size: 12px; line-height: 1.5; border-top: 1px solid #eaeded; }
        .urgent-tag { display: inline-block; background-color: ${accentColor}; color: #ffffff; padding: 4px 10px; font-size: 10px; font-weight: 700; border-radius: 2px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="https://res.cloudinary.com/demkiu4xj/image/upload/v1774018072/logo1_m98bgm.png" alt="Appifly Infotech">
            </div>
        </div>
        <div class="content">
            <div class="urgent-tag">${urgencyText}</div>
            <div class="title">${title}</div>
            <div class="message">
                Hello ${internName},<br><br>
                This is a courtesy reminder regarding your internship assignment. Our records indicate that a task assigned to you is due <strong>${timingWord}</strong>.
            </div>
            <div class="task-box">
                <div class="task-label">Assigned Task</div>
                <div class="task-value">${taskTitle}</div>
                <div class="task-label">Submission Deadline</div>
                <div class="task-value deadline">${new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at 11:59 PM</div>
            </div>
            ${type !== 'overdue' ? `
            <div style="text-align: center;">
                <a href="http://localhost:5173/intern/tasks" class="button">Submit Task Now</a>
            </div>
            ` : ''}
            <p style="font-size: 13px; color: #879596; margin-top: 30px;">
                Please ensure your work is submitted before the deadline to maintain your leaderboard standing and earn performance badges.
            </p>
        </div>
        <div class="footer">
            © ${new Date().getFullYear()} Internship Management Portal. All rights reserved.<br>
            This is an automated notification. Please do not reply directly to this email.
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * @param {string} userEmail 
 * @param {string} internName 
 * @param {string} taskTitle 
 * @param {Date} deadline 
 * @param {string} type 
 * @param {object} metadata - Optional metadata (userId, taskId) for logging
 */
exports.sendDeadlineNotification = async (userEmail, internName, taskTitle, deadline, type, metadata = {}) => {
    const { userId, taskId } = metadata;
    const timestamp = new Date().toISOString();
    
    try {
        let title = 'Task Deadline Reminder';
        let subject = `[Reminder] ${taskTitle} Deadline`;

        if (type === 'today') {
            title = 'Action Required: Task Due Today';
            subject = `[Urgent] ${taskTitle} is due today`;
        } else if (type === 'tomorrow') {
            title = 'Reminder: Task Due Tomorrow';
            subject = `[Reminder] ${taskTitle} is due tomorrow`;
        } else if (type === '2-days') {
            title = 'Upcoming Deadline: 2 Days Remain';
            subject = `[Notice] ${taskTitle} deadline in 2 days`;
        } else if (type === 'assigned') {
            title = 'New Task Assigned to You';
            subject = `[New Task] ${taskTitle} has been assigned`;
        } else if (type === 'overdue') {
            title = 'Action Required: Task Overdue';
            subject = `[Overdue] ${taskTitle} deadline has passed`;
        }

        const html = getEmailTemplate(title, internName, taskTitle, deadline, type);

        const mailOptions = {
            from: `"InternPortal Notifications" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: subject,
            html: html
        };

        console.log(`[EMAIL] ${timestamp} - Attempting to send email:`, {
            userEmail,
            taskTitle,
            type,
            userId,
            taskId
        });

        const result = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] ${timestamp} - Notification sent to ${userEmail} for task ${taskTitle} (${type})`);
        return result;
    } catch (error) {
        console.error(`[EMAIL ERROR] ${timestamp} - Failed to send notification to ${userEmail}:`, {
            error: error.message,
            userId,
            taskId
        });
    }
};
