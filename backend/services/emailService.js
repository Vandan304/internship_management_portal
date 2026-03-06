const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendInternCredentials = async (email, name, password, internId, role) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Internship Portal Account Created',
            text: `Hello ${name},

Your Internship Portal account has been created successfully.

Your login details are:

Email: ${email}
Password: ${password}
Intern ID: ${internId}
Role: ${role}

Please login and change your password after first login.

Portal Link:
http://localhost:5173/login

Best regards
Internship Management System`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        // We do not throw the error because we don't want to crash the server or stop intern creation
        return false;
    }
};

const sendOTPEmail = async (email, name, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP - Internship Portal',
            text: `Hello ${name},

You requested to reset your password. Here is your 6-digit OTP code:

${otp}

This code will expire in 10 minutes. If you did not request this, please ignore this email.

Best regards,
Internship Management System`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};

module.exports = {
    sendInternCredentials,
    sendOTPEmail
};
