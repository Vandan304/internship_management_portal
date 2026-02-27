const mongoose = require('mongoose');
require('dotenv').config();
const Certificate = require('./models/Certificate');
const User = require('./models/User');

const testCertificateModel = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create dummy users for references
        const admin = await User.create({
            name: 'Test Admin Cert',
            email: 'admincert@test.com',
            password: 'password123',
            role: 'admin'
        });

        const intern = await User.create({
            name: 'Test Intern Cert',
            email: 'interncert@test.com',
            password: 'password123',
            role: 'intern'
        });

        console.log('Dummy users created');

        // Create a certificate
        const cert = await Certificate.create({
            title: 'Completion Certificate',
            fileUrl: 'http://example.com/cert.pdf',
            fileName: 'cert.pdf',
            uploadedBy: admin._id,
            assignedTo: intern._id,
            isVisible: true,
            canDownload: true
        });

        console.log('Certificate created successfully:');
        console.log(cert);

        // Fetch to verify population
        const fetchedCert = await Certificate.findById(cert._id)
            .populate('uploadedBy', 'name role')
            .populate('assignedTo', 'name role');

        console.log('\nFetched Certificate with Populated Users:');
        console.log(fetchedCert);

        // Cleanup
        await Certificate.findByIdAndDelete(cert._id);
        await User.findByIdAndDelete(admin._id);
        await User.findByIdAndDelete(intern._id);
        console.log('\nCleanup successful');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testCertificateModel();
