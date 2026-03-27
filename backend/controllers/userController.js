const User = require('../models/User');
const Notification = require('../models/Notification');

// @route   PUT /api/users/update-profile
// @desc    Update an intern's profile (name, email)
// @access  Private/Intern
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;

        // SAFE AUTH CHECK: Ensure user is populated by authMiddleware
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized. User information missing.' });
        }

        // Ensure user exists
        let user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Only interns should use this route for self-editing
        if (user.role !== 'intern') {
            return res.status(403).json({ success: false, message: 'Only interns can update profile via this route' });
        }

        // Validate email uniqueness if email is changed
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
            }
            user.email = email;
        }

        if (name) {
            user.name = name;
        }

        // Save updated user (Note: role, isActive, loginAllowed are explicitly IGNORED from req.body)
        await user.save();

        // Create notification for profile update
        const notification = await Notification.create({
            userId: user._id,
            title: "Profile Update Successful",
            message: "Your profile information has been successfully updated.",
            type: "profile"
        });

        req.app.get('io').to(user._id.toString()).emit('newNotification', notification);

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                _id: user._id, // match requested payload format
                id: user._id,  // keep id for backward compatibility
                name: user.name,
                email: user.email,
                role: user.role,
                internId: user.internId
            }
        });

    } catch (error) {
        // SAFE ERROR HANDLING: Pass the error to the global handler
        next(error);
    }
};
