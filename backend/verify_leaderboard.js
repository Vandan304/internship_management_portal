require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');

async function verifyLeaderboard() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find a test intern
        const intern = await User.findOne({ role: 'intern' });
        if (!intern) {
            console.log('No intern found to test');
            process.exit(0);
        }

        const initialPoints = intern.points || 0;
        console.log(`Initial points: ${initialPoints}`);

        // 2. Create a dummy task for this intern
        const dummyTask = await Task.create({
            title: 'Leaderboard Test Task',
            description: 'Testing point awarding system',
            assignedTo: intern._id,
            weekNumber: 1,
            deadline: new Date(Date.now() + 86400000), // Tomorrow
            createdBy: intern._id, // Just for test
            status: 'submitted',
            submittedAt: new Date(), // Today (Early)
            pointsAwarded: false
        });

        console.log('Dummy task created with deadline tomorrow and submitted today (Early)');

        // 3. Simulate approveTask logic
        let pointsToAdd = 10;
        if (dummyTask.submittedAt && dummyTask.deadline && new Date(dummyTask.submittedAt) <= new Date(dummyTask.deadline)) {
            pointsToAdd += 5; // Early bonus
            console.log('Early submission bonus (+5) conditions met');
        }

        intern.points = (intern.points || 0) + pointsToAdd;
        await intern.save();
        dummyTask.status = 'approved';
        dummyTask.pointsAwarded = true;
        await dummyTask.save();

        console.log(`Awarded ${pointsToAdd} points`);
        
        const updatedIntern = await User.findById(intern._id);
        console.log(`Updated points: ${updatedIntern.points}`);

        if (updatedIntern.points === initialPoints + 15) {
            console.log('SUCCESS: Point awarding and early bonus logic verified!');
        } else {
            console.log('FAILURE: Points do not match expected value');
        }

        // Cleanup
        await Task.findByIdAndDelete(dummyTask._id);
        intern.points = initialPoints; // Reset
        await intern.save();
        console.log('Cleaned up test data');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyLeaderboard();
