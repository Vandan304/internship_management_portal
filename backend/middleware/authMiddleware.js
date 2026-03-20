const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) ||
        req.query.token
    ) {
        try {
            // Get token from header or query
            token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.query.token;

            // Verify token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'fallback_secret_for_development_only'
            );

            // Get user from the token and attach it to the request (exclude password)
            req.user = await User.findById(decoded.user.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            if (!req.user.isActive) {
                return res.status(403).json({ success: false, message: 'Account is inactive.' });
            }

            next();
        } catch (error) {
            console.error('JWT Verification Error:', error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

// Grant access to specific roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };
