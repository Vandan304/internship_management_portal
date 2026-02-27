const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();
const User = require('./models/User');
const Certificate = require('./models/Certificate');
const mongoose = require('mongoose');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

const testCertificateUpload = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create dummy users for testing
        const adminEmail = 'admin_cert_upload@test.com';
        const internEmail = 'intern_cert_upload@test.com';
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        await User.deleteMany({ email: { $in: [adminEmail, internEmail] } }); // clean up previous if any

        const admin = await User.create({ name: 'Admin Upload Test', email: adminEmail, password: hashedPassword, role: 'admin' });
        const intern = await User.create({ name: 'Intern Upload Test', email: internEmail, password: hashedPassword, role: 'intern' });

        console.log('Dummy Users created.');

        // 2. Login as admin to get the token
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: adminEmail,
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Obtained Admin JWT Token');

        // 3. Create a dummy test file in memory
        const testFilePath = path.join(__dirname, 'test-cert.pdf');
        fs.writeFileSync(testFilePath, 'Dummy PDF content for testing uploads');

        // 4. Build FormData for the multipart/form-data request
        const formData = new FormData();
        formData.append('title', 'Completion Certificate - Integration Test');
        formData.append('assignedTo', intern._id.toString());
        formData.append('isVisible', 'true');
        formData.append('canDownload', 'true');

        // Attach the file stream under the 'file' field as configured in upload.single('file')
        formData.append('file', fs.createReadStream(testFilePath));

        // 5. Send the POST request to upload endpoint
        console.log('Sending upload request to POST /api/certificates/upload...');
        const response = await axios.post(`${BASE_URL}/api/certificates/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Upload Successful!');
        console.log(response.data);

        // 6. Verify file exists in the uploads directory
        const serverFilePath = path.join(__dirname, response.data.certificate.fileUrl);
        if (fs.existsSync(serverFilePath)) {
            console.log(`\nVerified: Uploaded file physically exists on server at ${serverFilePath}`);
            // Cleanup the created PDF on the server
            fs.unlinkSync(serverFilePath);
        } else {
            console.error(`\nFailed: File not found on server at ${serverFilePath}`);
        }

        // Cleanup dummy assets
        fs.unlinkSync(testFilePath); // clean origin file
        await User.findByIdAndDelete(admin._id);
        await User.findByIdAndDelete(intern._id);

        // We delete the cert from Mongo via mongoose Model
        await Certificate.findByIdAndDelete(response.data.certificate._id);

        console.log('Test complete and cleaned up.');
        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
};
testCertificateUpload();