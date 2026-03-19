const User = require('../models/User');
const Notification = require('../models/Notification');
const Certificate = require('../models/Certificate');
const bcrypt = require('bcryptjs');
const path = require('path');

exports.getInterns = async (req, res, next) => {
    console.log('[API START] getInterns');
    try {
        const interns = await User.find({ role: 'intern' }).select('-password');
        console.log(`[DB QUERY SUCCESS] Fetched ${interns.length} interns`);
        res.json({ success: true, count: interns.length, data: interns });
    } catch (error) {
        console.error('[ERROR] getInterns:', error.message);
        next(error);
    }
};

// @route   POST /api/admin/intern
// @desc    Create a new intern
// @access  Private/Admin
exports.createIntern = async (req, res, next) => {
    console.log('[API START] createIntern');
    console.log('[BODY]', JSON.stringify(req.body));
    try {
        const { name, email, internRole, startDate, endDate } = req.body;
        console.log('[PARAMS]', `name: ${name}, email: ${email}, role: ${internRole}, dates: ${startDate} to ${endDate}`);
        
        if (!name || !email || !internRole) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, and internRole' });
        }

        const validInternRole = internRole.toLowerCase();

        const allowedRoles = ['fullstack', 'frontend', 'backend', 'ai', 'ml', 'datascience'];
        if (!allowedRoles.includes(validInternRole)) {
            return res.status(400).json({ success: false, message: 'Invalid role selected' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Intern already exists with this email' });
        }

        const generatedPassword = `${name.replace(/\s+/g, '').toLowerCase()}@${validInternRole}`;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(generatedPassword, salt);

        const currentYear = new Date().getFullYear();
        const lastIntern = await User.findOne({
            internId: new RegExp(`^INT-${currentYear}-`)
        }).sort({ createdAt: -1 });

        let sequenceCount = '001';
        if (lastIntern && lastIntern.internId) {
            const lastSequence = parseInt(lastIntern.internId.split('-')[2]);
            if (!isNaN(lastSequence)) {
                sequenceCount = (lastSequence + 1).toString().padStart(3, '0');
            }
        }
        const authInternId = `INT-${currentYear}-${sequenceCount}`;

        const intern = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'intern',
            internRole: validInternRole,
            internId: authInternId,
            startDate: startDate || null,
            endDate: endDate || null
        });
        console.log(`[DB CREATE SUCCESS] Intern created with ID: ${authInternId}`);

        // --- MODULE 2: OFFER LETTER GENERATION ---
        try {
            const pdfService = require('../services/pdfService');
            const Permission = require('../models/Permission');
            
            const offerLetterPath = `uploads/offerletters/offerletter_${intern._id}.pdf`;
            const template = pdfService.getOfferLetterTemplate({
                internName: name,
                internId: authInternId,
                position: validInternRole.toUpperCase(),
                startDate: startDate || new Date().toLocaleDateString()
            });

            await pdfService.generatePDF(template, path.join(__dirname, '..', offerLetterPath));
            console.log(`[FILE GENERATION SUCCESS] Offer letter created at ${offerLetterPath}`);

            intern.offerLetterPath = `/${offerLetterPath}`;
            intern.offerLetterAssigned = true;
            await intern.save();
            console.log('[DB UPDATE SUCCESS] Intern updated with offer letter path');

            await Permission.create({
                internId: intern._id,
                resourceType: 'offerletter',
                resourceName: 'Offer Letter',
                resourcePath: `/${offerLetterPath}`,
                visibilityEnabled: false,
                downloadEnabled: false
            });
            console.log('[DB CREATE SUCCESS] Permission entry for offer letter created');

        } catch (pdfError) {
            console.error('[ERROR] Offer letter generation failed:', pdfError.message);
            // Don't fail the whole request if PDF fails, but log it
        }

        const { sendInternCredentials } = require('../services/emailService');
        await sendInternCredentials(email, name, generatedPassword, authInternId, validInternRole);
        console.log('[EMAIL SUCCESS] Credentials sent to intern');

        const internResponse = intern.toObject();
        delete internResponse.password;

        res.status(201).json({ success: true, data: internResponse });
    } catch (error) {
        console.error('[ERROR] createIntern:', error.message);
        next(error);
    }
};

// @route   PUT /api/admin/intern/:id
// @desc    Update an intern details (name, email)
// @access  Private/Admin
exports.updateIntern = async (req, res, next) => {
    console.log('[API START] updateIntern');
    console.log('[PARAMS]', JSON.stringify(req.params));
    console.log('[BODY]', JSON.stringify(req.body));
    try {
        const { name, email, internRole, startDate, endDate } = req.body;

        let intern = await User.findById(req.params.id);

        if (!intern) {
            console.warn('[NOT FOUND] Intern not found');
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
            intern.email = email;
        }

        if (name) intern.name = name;
        if (internRole) intern.internRole = internRole.toLowerCase();
        if (startDate) intern.startDate = startDate;
        if (endDate) intern.endDate = endDate;
        if (req.body.isActive !== undefined) {
            intern.isActive = req.body.isActive;
        }

        await intern.save();
        console.log('[DB UPDATE SUCCESS] Intern details updated');

        const internResponse = intern.toObject();
        delete internResponse.password;

        res.json({ success: true, data: internResponse });
    } catch (error) {
        console.error('[ERROR] updateIntern:', error.message);
        next(error);
    }
};

// @route   DELETE /api/admin/intern/:id
// @desc    Delete an intern completely
// @access  Private/Admin
exports.deleteIntern = async (req, res, next) => {
    console.log('[API START] deleteIntern');
    console.log('[PARAMS]', JSON.stringify(req.params));
    try {
        const intern = await User.findById(req.params.id);

        if (!intern) {
            console.warn('[NOT FOUND] Intern not found');
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        if (intern.role !== 'intern') {
            return res.status(400).json({ success: false, message: 'Cannot delete non-intern users via this route' });
        }

        // Cleanup related data
        await Certificate.deleteMany({ assignedTo: req.params.id });
        await Notification.deleteMany({ userId: req.params.id });
        const Permission = require('../models/Permission');
        await Permission.deleteMany({ internId: req.params.id });

        await User.findByIdAndDelete(req.params.id);
        console.log('[DB DELETE SUCCESS] Intern and related data deleted');

        res.json({ success: true, message: 'Intern deleted successfully' });
    } catch (error) {
        console.error('[ERROR] deleteIntern:', error.message);
        next(error);
    }
};

// @route   PATCH /api/admin/intern/:id/block
// @desc    Block an intern login
// @access  Private/Admin
exports.blockIntern = async (req, res, next) => {
    console.log('[API START] blockIntern');
    console.log('[PARAMS]', JSON.stringify(req.params));
    try {
        const intern = await User.findById(req.params.id);

        if (!intern) {
            console.warn('[NOT FOUND] Intern not found');
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        if (intern.role !== 'intern') {
            return res.status(400).json({ success: false, message: 'Can only block interns' });
        }

        intern.loginAccess = false;
        await intern.save();
        console.log('[DB UPDATE SUCCESS] Intern login blocked');

        const notification = await Notification.create({
            userId: intern._id,
            title: "Account Restricted",
            message: "Your account login has been temporarily restricted by an administrator.",
            type: "system"
        });

        req.app.get('io').to(intern._id.toString()).emit('newNotification', notification);

        res.json({ success: true, message: 'Intern blocked successfully', data: { id: intern._id, loginAccess: intern.loginAccess } });
    } catch (error) {
        console.error('[ERROR] blockIntern:', error.message);
        next(error);
    }
};

// @route   PATCH /api/admin/intern/:id/activate
// @desc    Re-activate an intern login
// @access  Private/Admin
exports.activateIntern = async (req, res, next) => {
    console.log('[API START] activateIntern');
    console.log('[PARAMS]', JSON.stringify(req.params));
    try {
        const intern = await User.findById(req.params.id);

        if (!intern) {
            console.warn('[NOT FOUND] Intern not found');
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        if (intern.role !== 'intern') {
            return res.status(400).json({ success: false, message: 'Can only activate interns' });
        }

        intern.loginAccess = true;
        await intern.save();
        console.log('[DB UPDATE SUCCESS] Intern login activated');

        const notification = await Notification.create({
            userId: intern._id,
            title: "Account Activated",
            message: "Your account login has been restored by an administrator.",
            type: "system"
        });

        req.app.get('io').to(intern._id.toString()).emit('newNotification', notification);

        res.json({ success: true, message: 'Intern activated successfully', data: { id: intern._id, loginAccess: intern.loginAccess } });
    } catch (error) {
        console.error('[ERROR] activateIntern:', error.message);
        next(error);
    }
};

