const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @route   POST /api/auth/register
// @desc    Register a user (admin or intern)
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, password)' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'intern', // Default to intern if not provided
            loginAccess: true,
            isActive: true
        });

        await user.save();

        // Do NOT generate token here yet, as login is handled in Phase 4
        // Just return success response
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                internId: user.internId
            }
        });

    } catch (error) {
        next(error);
    }
};

const jwt = require('jsonwebtoken');

// @route   POST /api/auth/login
// @desc    Login a user and generate JWT token
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log(`[LOGIN ATTEMPT] Email: ${email}`);

        // Validate email and password inputs
        if (!email || !password) {
            console.log(`[LOGIN REJECTED] Email: ${email} - Reason: Missing credentials`);
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`[LOGIN REJECTED] Email: ${email} - Reason: User not found`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.loginAccess === false) {
            console.log(`[LOGIN REJECTED] Email: ${email} - Reason: Login access disabled`);
            return res.status(401).json({ success: false, message: 'Your login access has been disabled by admin.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[LOGIN REJECTED] Email: ${user.email} - Reason: Invalid password`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate JWT token
        const payload = {
            user: {
                id: user._id,
                role: user.role
            }
        };

        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '1d' }, // 1 day token expiration
            (err, token) => {
                if (err) throw err;

                // Define redirect URL based on role
                const redirectTo = user.role === 'admin' ? '/admin' : '/intern';

                console.log(`[LOGIN SUCCESS] Email: ${user.email}, Role: ${user.role}`);

                res.json({
                    success: true,
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        internId: user.internId
                    },
                    redirectTo
                });
            }
        );

    } catch (error) {
        next(error);
    }
};

// @route   POST /api/auth/forgot-password
// @desc    Generate OTP for forgotten passwords and email the user
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email address' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email' });
        }

        // Generate a random 4-digit OTP code securely
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Save the code to the user document alongside an expiration window (10 minutes)
        user.resetPasswordOtp = otpCode;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Transmit the code to the email handler
        const { sendOTPEmail } = require('../services/emailService');
        const emailSent = await sendOTPEmail(user.email, user.name, otpCode);

        if (!emailSent) {
            // Nullify codes if emailing fails dynamically 
            user.resetPasswordOtp = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ success: false, message: 'Error sending OTP email. Please try again later.' });
        }

        res.status(200).json({
            success: true,
            message: 'OTP has been sent to your email'
        });

    } catch (error) {
        next(error);
    }
};

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.resetPasswordOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (user.resetPasswordExpire < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        res.status(200).json({ success: true, message: 'OTP verified successfully' });

    } catch (error) {
        next(error);
    }
};

// @route   POST /api/auth/reset-password
// @desc    Reset password using email and new password
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide email and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.resetPasswordOtp || user.resetPasswordExpire < Date.now()) {
            return res.status(400).json({ success: false, message: 'Password reset session expired. Please request a new OTP.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });

    } catch (error) {
        next(error);
    }
};
