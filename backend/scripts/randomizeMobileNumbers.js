require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path to User model

// Random Indian Mobile Number Generator (starting with 9,8,7,6)
const generateRandomMobile = () => {
    const prefixes = ['9', '8', '7', '6'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let number = prefix;
    for (let i = 0; i < 9; i++) {
        number += Math.floor(Math.random() * 10).toString();
    }
    return number;
};

const randomizeMobileNumbers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB successfully.");

        // Find all users (or only those with 9876543210)
        // The user said "dummay number change not same", so we will find all interns that have exactly '9876543210'
        const usersToUpdate = await User.find({ mobileNumber: '9876543210' });
        console.log(`Found ${usersToUpdate.length} interns with the identical dummy mobile number...`);

        let count = 0;
        for (const user of usersToUpdate) {
            user.mobileNumber = generateRandomMobile();
            await user.save();
            count++;
        }

        console.log(`Successfully updated ${count} records with unique random mobile numbers.`);

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        mongoose.disconnect();
        console.log("Disconnected from DB.");
    }
};

randomizeMobileNumbers();
