const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();
const User = require('./models/User');
const mongoose = require('mongoose');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

const testAdminCertificateMgmt = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Setup Data - Create users
        const adminEmail = 'admin_cert_mgmt@test.com';
        const internEmail = 'intern_cert_mgmt@test.com';
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        await User.deleteMany({ email: { $in: [adminEmail, internEmail] } });

        const admin = await User.create({ name: 'Admin Mgmt Test', email: adminEmail, password: hashedPassword, role: 'admin' });
        const intern = await User.create({ name: 'Intern Mgmt Test', email: internEmail, password: hashedPassword, role: 'intern' });

        // 2. Login
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, { email: adminEmail, password: 'password123' });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 3. Upload a file for testing CRUD
        const testFilePath = path.join(__dirname, 'test-cert-mgmt.pdf');
        fs.writeFileSync(testFilePath, 'Dummy mgmt pdf');

        const formData = new FormData();
        formData.append('title', 'Initial Title');
        formData.append('assignedTo', intern._id.toString());
        formData.append('isVisible', 'false');
        formData.append('canDownload', 'false');
        formData.append('file', fs.createReadStream(testFilePath));

        console.log('--- Creating Certificate ---');
        const uploadRes = await axios.post(`${BASE_URL}/api/certificates/upload`, formData, {
            headers: { ...formData.getHeaders(), Authorization: `Bearer ${token}` }
        });
        const certId = uploadRes.data.certificate._id;
        console.log('Created ID:', certId);

        // 4. Test GET /api/certificates
        console.log('\n--- Testing GET /api/certificates ---');
        const getRes = await axios.get(`${BASE_URL}/api/certificates`, config);
        console.log(`Fetched ${getRes.data.count} certificates. Success: ${getRes.data.success}`);

        // 5. Test PUT /api/certificates/:id
        console.log('\n--- Testing PUT /api/certificates/:id ---');
        const updateRes = await axios.put(`${BASE_URL}/api/certificates/${certId}`, { title: 'Updated Title' }, config);
        console.log(`Updated title to: ${updateRes.data.data.title}`);

        // 6. Test PATCH /api/certificates/:id/visibility
        console.log('\n--- Testing PATCH /api/certificates/:id/visibility ---');
        const visRes = await axios.patch(`${BASE_URL}/api/certificates/${certId}/visibility`, {}, config);
        console.log(`Toggled visibility to: ${visRes.data.data.isVisible}`);

        // 7. Test PATCH /api/certificates/:id/download
        console.log('\n--- Testing PATCH /api/certificates/:id/download ---');
        const dlRes = await axios.patch(`${BASE_URL}/api/certificates/${certId}/download`, {}, config);
        console.log(`Toggled downloadable to: ${dlRes.data.data.canDownload}`);

        // 8. Test DELETE /api/certificates/:id
        console.log('\n--- Testing DELETE /api/certificates/:id ---');
        const delRes = await axios.delete(`${BASE_URL}/api/certificates/${certId}`, config);
        console.log(delRes.data.message);

        // Verify file deletion in filesystem
        const fileShouldBeDeletedPath = path.join(__dirname, uploadRes.data.certificate.fileUrl);
        if (fs.existsSync(fileShouldBeDeletedPath)) {
            console.error('FAIL: File was NOT deleted from filesystem!');
        } else {
            console.log('SUCCESS: File properly removed from filesystem during item deletion.');
        }

        // Cleanup test artifacts
        fs.unlinkSync(testFilePath);
        await User.findByIdAndDelete(admin._id);
        await User.findByIdAndDelete(intern._id);

        console.log('\nTest suite completed gracefully.');
        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
};

testAdminCertificateMgmt();
