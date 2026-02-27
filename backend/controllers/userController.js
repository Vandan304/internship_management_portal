const User = require('../models/User');
const Notification = require('../models/Notification');

// @route   PUT /api/users/update-profile
// @desc    Update an intern's profile (name, email)
// @access  Private/Intern
exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;

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
        await Notification.create({
            userId: user._id,
            title: "Profile Update Successful",
            message: "Your profile information has been successfully updated.",
            type: "profile"
        });

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                _id: user._id, // match requested payload format
                id: user._id,  // keep id for backward compatibility
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server error during profile update' });
    }
};
