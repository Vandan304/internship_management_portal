const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();
const User = require('./models/User');
const Certificate = require('./models/Certificate');
const mongoose = require('mongoose');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

const testInternCertificateAccess = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Setup Data - Create users
        const adminEmail = 'admin_cert_access@test.com';
        const internEmail1 = 'intern1_cert_access@test.com'; // Target Intern
        const internEmail2 = 'intern2_cert_access@test.com'; // Bystander Intern
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        await User.deleteMany({ email: { $in: [adminEmail, internEmail1, internEmail2] } });

        const admin = await User.create({ name: 'Admin Access Test', email: adminEmail, password: hashedPassword, role: 'admin' });
        const intern1 = await User.create({ name: 'Intern Access Test 1', email: internEmail1, password: hashedPassword, role: 'intern' });
        const intern2 = await User.create({ name: 'Intern Access Test 2', email: internEmail2, password: hashedPassword, role: 'intern' });

        // 2. Admin Login to setup certificates
        const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, { email: adminEmail, password: 'password123' });
        const adminToken = adminLogin.data.token;

        // Common temp file for upload
        const testFilePath = path.join(__dirname, 'test-cert-access.pdf');
        fs.writeFileSync(testFilePath, 'Dummy pdf for access testing');

        // Certificate 1: Assigned to Intern 1, Visible = TRUE, Downloadable = FALSE
        const formData1 = new FormData();
        formData1.append('title', 'Cert 1 - Visible');
        formData1.append('assignedTo', intern1._id.toString());
        formData1.append('isVisible', 'true');
        formData1.append('canDownload', 'false');
        formData1.append('file', fs.createReadStream(testFilePath));
        const res1 = await axios.post(`${BASE_URL}/api/certificates/upload`, formData1, { headers: { ...formData1.getHeaders(), Authorization: `Bearer ${adminToken}` } });

        // Certificate 2: Assigned to Intern 1, Visible = FALSE, Downloadable = TRUE
        const formData2 = new FormData();
        formData2.append('title', 'Cert 2 - Hidden');
        formData2.append('assignedTo', intern1._id.toString());
        formData2.append('isVisible', 'false');
        formData2.append('canDownload', 'true');
        formData2.append('file', fs.createReadStream(testFilePath));
        const res2 = await axios.post(`${BASE_URL}/api/certificates/upload`, formData2, { headers: { ...formData2.getHeaders(), Authorization: `Bearer ${adminToken}` } });

        // Certificate 3: Assigned to Intern 2, Visible = TRUE, Downloadable = TRUE
        const formData3 = new FormData();
        formData3.append('title', 'Cert 3 - Belongs to Someone Else');
        formData3.append('assignedTo', intern2._id.toString());
        formData3.append('isVisible', 'true');
        formData3.append('canDownload', 'true');
        formData3.append('file', fs.createReadStream(testFilePath));
        const res3 = await axios.post(`${BASE_URL}/api/certificates/upload`, formData3, { headers: { ...formData3.getHeaders(), Authorization: `Bearer ${adminToken}` } });

        console.log('Setup: 3 Certificates generated properly.');

        // 3. Intern 1 Login
        const internLogin = await axios.post(`${BASE_URL}/api/auth/login`, { email: internEmail1, password: 'password123' });
        const internToken = internLogin.data.token;
        const internConfig = { headers: { Authorization: `Bearer ${internToken}` } };

        // 4. Test GET /api/certificates/my-certificates
        console.log('\n--- Testing Intern Access Endpoint ---');
        const getRes = await axios.get(`${BASE_URL}/api/certificates/my-certificates`, internConfig);

        console.log(`Success: ${getRes.data.success}`);
        console.log(`Matches Returned: ${getRes.data.count} (Should be exactly 1)`);

        if (getRes.data.count !== 1) {
            console.error('FAIL: Expected exactly 1 certificate but got', getRes.data.count);
            process.exit(1);
        }

        const cert = getRes.data.data[0];
        console.log(`Fetched Cert Title: ${cert.title}`);

        // Assert we returned ONLY specific fields (plus mongoose _id)
        if (cert.uploadedBy || cert.assignedTo || cert.isVisible) {
            console.error('FAIL: Output contained sensitive/unrequested fields!');
            console.log(cert);
            process.exit(1);
        } else {
            console.log('SUCCESS: Extraneous fields properly scrubbed (select parameter worked).');
        }

        // Cleanup DB and Files
        fs.unlinkSync(testFilePath);

        // delete physically from server
        try { fs.unlinkSync(path.join(__dirname, res1.data.certificate.fileUrl)); } catch (e) { }
        try { fs.unlinkSync(path.join(__dirname, res2.data.certificate.fileUrl)); } catch (e) { }
        try { fs.unlinkSync(path.join(__dirname, res3.data.certificate.fileUrl)); } catch (e) { }

        // clean Mongo
        await Certificate.deleteMany({ _id: { $in: [res1.data.certificate._id, res2.data.certificate._id, res3.data.certificate._id] } });
        await User.deleteMany({ email: { $in: [adminEmail, internEmail1, internEmail2] } });

        console.log('\nTest suite completed gracefully.');
        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
};

testInternCertificateAccess();
