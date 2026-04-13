const fs = require('fs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const migrate = async () => {
    try {
        fs.writeFileSync('migration.log', 'Connecting to MongoDB...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        fs.appendFileSync('migration.log', 'Connected to MongoDB\n');

        const result = await User.updateMany(
            { role: 'intern', $or: [{ mobileNumber: { $exists: false } }, { mobileNumber: null }] },
            { $set: { mobileNumber: '9876543210' } }
        );

        fs.appendFileSync('migration.log', `Migration Complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}\n`);
        process.exit(0);
    } catch (error) {
        fs.appendFileSync('migration.log', 'Migration Error: ' + error.stack + '\n');
        process.exit(1);
    }
};

migrate();
