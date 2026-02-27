const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// @route   POST /api/certificates/upload
// @desc    Upload a certificate for an intern
// @access  Private/Admin
exports.uploadCertificate = async (req, res, next) => {
    try {
        // 1. Check if file was actually uploaded by multer
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const { title, assignedTo, isVisible, canDownload } = req.body;

        // 2. Validate required text fields
        if (!title || !assignedTo) {
            return res.status(400).json({ success: false, message: 'Please provide a title and assign the certificate to an intern' });
        }

        // 3. Verify the assigned intern exists
        const intern = await User.findById(assignedTo);
        if (!intern) {
            return res.status(404).json({ success: false, message: 'Assigned intern not found' });
        }

        if (intern.role !== 'intern') {
            return res.status(400).json({ success: false, message: 'Certificates can only be assigned to interns' });
        }

        // 4. Construct file URL
        const fileUrl = `/uploads/certificates/${req.file.filename}`;

        // 5. Create the Certificate record in DB
        const certificate = await Certificate.create({
            title,
            fileUrl,
            fileName: req.file.originalname,
            uploadedBy: req.user.id, // Comes from authMiddleware (Admin) // SAFE
            assignedTo,
            isVisible: isVisible === 'true' || isVisible === true,
            canDownload: canDownload === 'true' || canDownload === true
        });

        // 6. Create notification for the assigned intern
        const notification = await Notification.create({
            userId: assignedTo,
            title: "New Certificate Assigned",
            message: `You have been assigned the "${title}" certificate.`,
            type: "certificate",
            certificateId: certificate._id
        });

        // 7. Emit real-time socket event
        req.app.get('io').to(assignedTo.toString()).emit('newNotification', notification);
        req.app.get('io').to(assignedTo.toString()).emit('refreshCertificates');

        // 8. Return success response
        res.status(201).json({
            success: true,
            certificate
        });

    } catch (error) {
        next(error);
    }
};

// @route   GET /api/certificates
// @desc    Get all certificates
// @access  Private/Admin
exports.getAllCertificates = async (req, res, next) => {
    try {
        const certificates = await Certificate.find()
            .populate('assignedTo', 'name email')
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: certificates.length,
            data: certificates
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/certificates/permissions
// @desc    Get all certificates with their assigned interns for permissions page
// @access  Private/Admin
exports.getCertificatePermissions = async (req, res, next) => {
    try {
        const certificates = await Certificate.find({ assignedTo: { $ne: null } })
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });

        // Map to expected response format
        const formattedCertificates = certificates.map(cert => ({
            _id: cert._id,
            title: cert.title,
            intern: cert.assignedTo ? {
                _id: cert.assignedTo._id,
                name: cert.assignedTo.name,
                email: cert.assignedTo.email
            } : null,
            isVisible: cert.isVisible,
            canDownload: cert.canDownload
        }));

        res.json({
            success: true,
            certificates: formattedCertificates
        });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/certificates/:id
// @desc    Update certificate metadata
// @access  Private/Admin
exports.updateCertificate = async (req, res, next) => {
    try {
        const { title, isVisible, canDownload } = req.body;

        let certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        certificate = await Certificate.findByIdAndUpdate(
            req.params.id,
            {
                title: title || certificate.title,
                isVisible: isVisible !== undefined ? isVisible : certificate.isVisible,
                canDownload: canDownload !== undefined ? canDownload : certificate.canDownload
            },
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name email').populate('uploadedBy', 'name');

        res.json({
            success: true,
            data: certificate
        });
    } catch (error) {
        next(error);
    }
};

// @route   DELETE /api/certificates/:id
// @desc    Delete a certificate
// @access  Private/Admin
exports.deleteCertificate = async (req, res, next) => {
    try {
        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        // Delete the file from the filesystem
        if (certificate.fileUrl) {
            const filePath = path.join(__dirname, '..', certificate.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await certificate.deleteOne();

        res.json({
            success: true,
            message: 'Certificate deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @route   PATCH /api/certificates/:id/visibility
// @desc    Toggle certificate visibility
// @access  Private/Admin
exports.toggleVisibility = async (req, res, next) => {
    try {
        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        certificate.isVisible = !certificate.isVisible;
        await certificate.save();

        if (certificate.assignedTo) {
            req.app.get('io').to(certificate.assignedTo.toString()).emit('refreshCertificates');
        }

        res.json({
            success: true,
            message: `Certificate visibility set to ${certificate.isVisible}`,
            data: certificate
        });
    } catch (error) {
        next(error);
    }
};

// @route   PATCH /api/certificates/:id/download
// @desc    Toggle certificate download permission
// @access  Private/Admin
exports.toggleDownload = async (req, res, next) => {
    try {
        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        certificate.canDownload = !certificate.canDownload;
        await certificate.save();

        // If permission was granted and there is an assigned user, create a notification
        if (certificate.canDownload && certificate.assignedTo) {
            const notification = await Notification.create({
                userId: certificate.assignedTo,
                title: "Download Permission Enabled",
                message: `You can now download your "${certificate.title}" certificate.`,
                type: "certificate",
                certificateId: certificate._id
            });
            req.app.get('io').to(certificate.assignedTo.toString()).emit('newNotification', notification);
        }

        if (certificate.assignedTo) {
            req.app.get('io').to(certificate.assignedTo.toString()).emit('refreshCertificates');
        }

        res.json({
            success: true,
            message: `Certificate download permission set to ${certificate.canDownload}`,
            data: certificate
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/certificates/my-certificates
// @desc    Get certificates assigned to logged-in intern
// @access  Private/Intern
exports.getMyCertificates = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized. User information missing.' });
        }

        const certificates = await Certificate.find({
            assignedTo: req.user.id,
            isVisible: true
        })
            .select('title fileUrl canDownload createdAt fileName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: certificates.length,
            data: certificates
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/certificates/download/:id
// @desc    Download a certificate file securely
// @access  Private/Intern
exports.downloadCertificate = async (req, res, next) => {
    try {
        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized. User information missing.' });
        }

        // 1. Verify ownership (Only the assigned intern can download)
        if (certificate.assignedTo.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this certificate' });
        }

        // 2. Verify download permission and visibility
        if (!certificate.isVisible) {
            return res.status(403).json({ success: false, message: 'Certificate is not visible' });
        }
        if (!certificate.canDownload) {
            return res.status(403).json({ success: false, message: 'Download permission is disabled for this certificate' });
        }

        // 3. Construct absolute file path
        const filePath = path.join(__dirname, '..', certificate.fileUrl);

        // 4. Check if file physically exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File no longer exists on the server' });
        }

        // 5. Send file for download securely
        res.download(filePath, certificate.fileName);

    } catch (error) {
        next(error);
    }
};
