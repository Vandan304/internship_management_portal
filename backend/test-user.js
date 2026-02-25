require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testUserModel() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a generic test user
        const testUser = new User({
            name: 'Test Intern',
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            role: 'intern'
            // isActive and loginAllowed will be true by default
        });

        const savedUser = await testUser.save();
        console.log('User model is usable! Test user saved successfully:', savedUser);

        // Clean up test user
        await User.findByIdAndDelete(savedUser._id);
        console.log('Test user cleaned up.');

    } catch (error) {
        console.error('Error testing User model:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testUserModel();
