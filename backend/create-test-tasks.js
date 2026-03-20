require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./models/Task');
const User = require('./models/User');

async function createTestTasks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find an intern to assign to
        const intern = await User.findOne({ role: 'intern' });
        // Find an admin to be the creator
        const admin = await User.findOne({ role: 'admin' });

        if (!intern || !admin) {
            console.error('Required users (intern and admin) not found.');
            process.exit(1);
        }

        const now = new Date();

        // Task due Today (11:59 PM)
        const todayTask = new Date(now);
        todayTask.setHours(23, 59, 0, 0);

        // Task due Tomorrow
        const tomorrowTask = new Date(now);
        tomorrowTask.setDate(now.getDate() + 1);

        // Task due in 2 Days
        const twoDaysTask = new Date(now);
        twoDaysTask.setDate(now.getDate() + 2);

        const testTasks = [
            {
                title: 'Test Task: Due Today',
                description: 'Testing today notification',
                deadline: todayTask,
                assignedTo: intern._id,
                createdBy: admin._id,
                weekNumber: 7,
                status: 'pending'
            },
            {
                title: 'Test Task: Due Tomorrow',
                description: 'Testing tomorrow notification',
                deadline: tomorrowTask,
                assignedTo: intern._id,
                createdBy: admin._id,
                weekNumber: 7,
                status: 'pending'
            },
            {
                title: 'Test Task: Due in 2 Days',
                description: 'Testing 2-day notification',
                deadline: twoDaysTask,
                assignedTo: intern._id,
                createdBy: admin._id,
                weekNumber: 7,
                status: 'pending'
            }
        ];

        await Task.insertMany(testTasks);
        console.log('Successfully created 3 test tasks for Today, Tomorrow, and 2 Days.');
        process.exit(0);
    } catch (e) {
        console.error('Validation failed or error:', e.message);
        process.exit(1);
    }
}
createTestTasks();