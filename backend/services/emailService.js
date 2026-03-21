const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const getBaseTemplate = (title, content, buttonLabel, buttonLink) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f2f3f3; margin: 0; padding: 0; color: #16191f; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 2px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12); border-top: 4px solid #232f3e; }
        .header { padding: 30px 40px; background-color: #ffffff; text-align: center; }
        .logo img { max-height: 120px; max-width: 200px; display: block; margin: 0 auto; object-fit: contain; }
        .content { padding: 40px; border-top: 1px solid #eaeded; }
        .title { font-size: 20px; font-weight: 700; color: #16191f; margin-bottom: 24px; }
        .message { font-size: 16px; line-height: 24px; color: #545b64; margin-bottom: 30px; }
        .button { display: inline-block; background-color: #ec7211; color: #ffffff !important; padding: 12px 25px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 2px; text-transform: uppercase; }
        .footer { padding: 30px 40px; background-color: #f2f3f3; color: #879596; font-size: 12px; line-height: 1.5; border-top: 1px solid #eaeded; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="cid:applogo" alt="Appifly Infotech">
            </div>
        </div>
        <div class="content">
            <div class="title">${title}</div>
            <div class="message">${content}</div>
            ${buttonLabel ? `<div style="text-align: center;"><a href="${buttonLink}" class="button">${buttonLabel}</a></div>` : ''}
        </div>
        <div class="footer">
            © ${new Date().getFullYear()} appifly Infotech - Internship Management Portal.<br>
            This is an automated notification. Please do not reply directly to this email.
        </div>
    </div>
</body>
</html>`;
};

const sendInternCredentials = async (email, name, password, internId, role) => {
    try {
        const content = `
            Hello ${name},<br><br>
            Your account on the Internship Portal has been successfully created. Please use the credentials below to log in:<br><br>
            <strong>Email:</strong> ${email}<br>
            <strong>Password:</strong> ${password}<br>
            <strong>Intern ID:</strong> ${internId}<br>
            <strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}<br><br>
            Please log in and update your password immediately after your first access.
        `;

        const html = getBaseTemplate('Portal Account Created', content, 'Login to Portal', 'http://localhost:5173/login');

        const mailOptions = {
            from: `"Appifly Intern Portal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Internship Portal Account Created',
            html: html,
            attachments: [{
                filename: 'logo1_backup.png',
                path: require('path').join(__dirname, '../../frontend/src/assets/logo1_backup.png'),
                cid: 'applogo'
            }]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendOTPEmail = async (email, name, otp) => {
    try {
        const content = `
            Hello ${name},<br><br>
            You requested to reset your password. Here is your verification code:<br><br>
            <div style="font-size: 24px; font-weight: 700; color: #ec7211; letter-spacing: 5px; text-align: center; margin: 20px 0;">${otp}</div>
            This code will expire in <strong>10 minutes</strong>. If you did not request this reset, please ignore this email.
        `;

        const html = getBaseTemplate('Verification Code', content);

        const mailOptions = {
            from: `"Appifly Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP - Internship Portal',
            html: html,
            attachments: [{
                filename: 'logo1_backup.png',
                path: require('path').join(__dirname, '../../frontend/src/assets/logo1_backup.png'),
                cid: 'applogo'
            }]
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
