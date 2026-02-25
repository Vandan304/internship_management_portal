const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @route   POST /api/auth/register
// @desc    Register a user (admin or intern)
// @access  Public
exports.register = async (req, res) => {
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
            role: role || 'intern' // Default to intern if not provided
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
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

const jwt = require('jsonwebtoken');

// @route   POST /api/auth/login
// @desc    Login a user and generate JWT token
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email and password inputs
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if isActive and loginAllowed
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is inactive. Please contact support.' });
        }

        if (!user.loginAllowed) {
            return res.status(403).json({ success: false, message: 'Login is not allowed for this account.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
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

                res.json({
                    success: true,
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    },
                    redirectTo
                });
            }
        );

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};
