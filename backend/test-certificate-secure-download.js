const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();
const User = require('./models/User');
const Certificate = require('./models/Certificate');
const mongoose = require('mongoose');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

const testSecureDownload = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for Secure Download Test');

        // Setup Users
        const adminEmail = 'admin_download@test.com';
        const internEmail1 = 'intern1_download@test.com'; // Owner
        const internEmail2 = 'intern2_download@test.com'; // Unauthorized

        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        await User.deleteMany({ email: { $in: [adminEmail, internEmail1, internEmail2] } });

        const admin = await User.create({ name: 'Admin', email: adminEmail, password: hashedPassword, role: 'admin' });
        const intern1 = await User.create({ name: 'Intern Owner', email: internEmail1, password: hashedPassword, role: 'intern' });
        const intern2 = await User.create({ name: 'Intern Intruder', email: internEmail2, password: hashedPassword, role: 'intern' });

        // Admin Token
        const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, { email: adminEmail, password: 'password123' });
        const adminToken = adminLogin.data.token;

        // Create PDF
        const testFilePath = path.join(__dirname, 'test-download.pdf');
        fs.writeFileSync(testFilePath, 'Dummy Data for Download Testing');

        // Target Certificate: Owned by Intern 1
        const formData = new FormData();
        formData.append('title', 'Secret Certificate');
        formData.append('assignedTo', intern1._id.toString());
        formData.append('isVisible', 'true');
        formData.append('canDownload', 'true');
        formData.append('file', fs.createReadStream(testFilePath));

        const uploadRes = await axios.post(`${BASE_URL}/api/certificates/upload`, formData, {
            headers: { ...formData.getHeaders(), Authorization: `Bearer ${adminToken}` }
        });

        const certId = uploadRes.data.certificate._id;

        // Intern 1 Token
        const intern1Login = await axios.post(`${BASE_URL}/api/auth/login`, { email: internEmail1, password: 'password123' });
        const intern1Token = intern1Login.data.token;

        // Intern 2 Token
        const intern2Login = await axios.post(`${BASE_URL}/api/auth/login`, { email: internEmail2, password: 'password123' });
        const intern2Token = intern2Login.data.token;

        console.log('\n--- Test 1: Authorized Intern Downloading Allowed Cert ---');
        try {
            const downloadRes = await axios.get(`${BASE_URL}/api/certificates/download/${certId}`, {
                headers: { Authorization: `Bearer ${intern1Token}` },
                responseType: 'arraybuffer' // Handle file download
            });
            console.log(`Success! File Buffer length: ${downloadRes.data.length}`);
        } catch (e) {
            console.error('FAIL: Authorized intern was blocked!');
            throw e;
        }

        console.log('\n--- Test 2: Unauthorized Intern Tries Downloading ---');
        try {
            await axios.get(`${BASE_URL}/api/certificates/download/${certId}`, {
                headers: { Authorization: `Bearer ${intern2Token}` },
                responseType: 'arraybuffer'
            });
            console.error('FAIL: Vulnerability found! Unauthorized intern downloaded the cert!');
            process.exit(1);
        } catch (e) {
            if (e.response.status === 403) {
                console.log(`Success: Blocked with HTTP ${e.response.status} - ${e.response.data.message}`);
            } else { throw e; }
        }

        console.log('\n--- Test 3: Authorized Intern Tries Downloading Disabled Cert ---');
        // Admin toggles download off
        await axios.patch(`${BASE_URL}/api/certificates/${certId}/download`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });

        try {
            await axios.get(`${BASE_URL}/api/certificates/download/${certId}`, {
                headers: { Authorization: `Bearer ${intern1Token}` },
                responseType: 'arraybuffer'
            });
            console.error('FAIL: Intern downloaded a disabled certificate!');
            process.exit(1);
        } catch (e) {
            if (e.response.status === 403) {
                console.log(`Success: Blocked with HTTP ${e.response.status} - ${e.response.data.message}`);
            } else { throw e; }
        }

        // Cleanup
        fs.unlinkSync(testFilePath);
        try { fs.unlinkSync(path.join(__dirname, uploadRes.data.certificate.fileUrl)); } catch (e) { }
        await Certificate.findByIdAndDelete(certId);
        await User.deleteMany({ _id: { $in: [admin._id, intern1._id, intern2._id] } });

        console.log('\nAll security assertions passed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
};

testSecureDownload();
