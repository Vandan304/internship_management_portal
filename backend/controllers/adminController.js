const User = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

// @route   GET /api/admin/interns
// @desc    Get all interns
// @access  Private/Admin
exports.getInterns = async (req, res, next) => {
    try {
        const interns = await User.find({ role: 'intern' }).select('-password');
        res.json({ success: true, count: interns.length, data: interns });
    } catch (error) {
        next(error);
    }
};

// @route   POST /api/admin/intern
// @desc    Create a new intern
// @access  Private/Admin
exports.createIntern = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Intern already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const intern = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'intern'
        });

        // Exclude password in response
        const internResponse = intern.toObject();
        delete internResponse.password;

        res.status(201).json({ success: true, data: internResponse });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/admin/intern/:id
// @desc    Update an intern details (name, email)
// @access  Private/Admin
exports.updateIntern = async (req, res, next) => {
    try {
        const { name, email } = req.body;

        let intern = await User.findById(req.params.id);

        if (!intern) {
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        if (intern.role !== 'intern') {
            return res.status(400).json({ success: false, message: 'Cannot update non-intern users via this route' });
        }

        if (email && email !== intern.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'Email is already in use' });
            }
        }

        intern.name = name || intern.name;
        intern.email = email || intern.email;
        if (req.body.isActive !== undefined) {
            intern.isActive = req.body.isActive;
        }

        await intern.save();

        const internResponse = intern.toObject();
        delete internResponse.password;

        res.json({ success: true, data: internResponse });
    } catch (error) {
        next(error);
    }
};

// @route   DELETE /api/admin/intern/:id
// @desc    Delete an intern completely
// @access  Private/Admin
exports.deleteIntern = async (req, res, next) => {
    try {
        const intern = await User.findById(req.params.id);

        if (!intern) {
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        if (intern.role !== 'intern') {
            return res.status(400).json({ success: false, message: 'Cannot delete non-intern users via this route' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Intern deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   PATCH /api/admin/intern/:id/block
// @desc    Block an intern login
// @access  Private/Admin
exports.blockIntern = async (req, res, next) => {
    try {
        const intern = await User.findById(req.params.id);

        if (!intern) {
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        if (intern.role !== 'intern') {
            return res.status(400).json({ success: false, message: 'Can only block interns' });
        }

        intern.loginAllowed = false;
        await intern.save();

        const notification = await Notification.create({
            userId: intern._id,
            title: "Account Restricted",
            message: "Your account login has been temporarily restricted by an administrator.",
            type: "system"
        });

        req.app.get('io').to(intern._id.toString()).emit('newNotification', notification);

        res.json({ success: true, message: 'Intern blocked successfully', data: { id: intern._id, loginAllowed: intern.loginAllowed } });
    } catch (error) {
        next(error);
    }
};

// @route   PATCH /api/admin/intern/:id/activate
// @desc    Re-activate an intern login
// @access  Private/Admin
exports.activateIntern = async (req, res, next) => {
    try {
        const intern = await User.findById(req.params.id);

        if (!intern) {
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        if (intern.role !== 'intern') {
            return res.status(400).json({ success: false, message: 'Can only activate interns' });
        }

        intern.loginAllowed = true;
        await intern.save();

        const notification = await Notification.create({
            userId: intern._id,
            title: "Account Activated",
            message: "Your account login has been restored by an administrator.",
            type: "system"
        });

        req.app.get('io').to(intern._id.toString()).emit('newNotification', notification);

        res.json({ success: true, message: 'Intern activated successfully', data: { id: intern._id, loginAllowed: intern.loginAllowed } });
    } catch (error) {
        next(error);
    }
};
