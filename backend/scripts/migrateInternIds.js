require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrateInternIds() {
    try {
        console.log('--- Start Migration: Intern ID Format Update ---');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const interns = await User.find({ role: 'intern' }).sort({ createdAt: 1 });
        console.log(`Found ${interns.length} interns.`);

        
        
        console.log('Step 1: Assigning temporary IDs to avoid clashing during transition...');
        for (let i = 0; i < interns.length; i++) {
            interns[i].internId = `TEMP_${i}_${Date.now()}`;
            await interns[i].save();
        }

        console.log('Step 2: Assigning new APPI IDs...');
        for (let i = 0; i < interns.length; i++) {
            const newId = `APPI${(i + 1).toString().padStart(3, '0')}`;
            console.log(`Updating Intern: ${interns[i].name} -> ${newId}`);
            interns[i].internId = newId;
            await interns[i].save();
        }

        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateInternIds();
