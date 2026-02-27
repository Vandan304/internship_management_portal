const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// @route   POST /api/certificates/upload
// @desc    Upload a certificate for an intern
// @access  Private/Admin
exports.uploadCertificate = async (req, res) => {
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
        // req.file.filename is generated safely by multer
        // We will serve the 'uploads' folder statically in server.js so it can be accessed
        const fileUrl = `/uploads/certificates/${req.file.filename}`;

        // 5. Create the Certificate record in DB
        const certificate = await Certificate.create({
            title,
            fileUrl,
            fileName: req.file.originalname,
            uploadedBy: req.user.id, // Comes from authMiddleware (Admin)
            assignedTo,
            isVisible: isVisible === 'true' || isVisible === true,
            canDownload: canDownload === 'true' || canDownload === true
        });

        // 6. Create notification for the assigned intern
        await Notification.create({
            userId: assignedTo,
            title: "New Certificate Assigned",
            message: `You have been assigned the "${title}" certificate.`,
            type: "certificate",
            certificateId: certificate._id
        });

        // 7. Return success response
        res.status(201).json({
            success: true,
            certificate
        });

    } catch (error) {
        console.error('Error uploading certificate:', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
};

// @route   GET /api/certificates
// @desc    Get all certificates
// @access  Private/Admin
exports.getAllCertificates = async (req, res) => {
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
        console.error('Error fetching certificates:', error);
        res.status(500).json({ success: false, message: 'Server error fetching certificates' });
    }
};

// @route   GET /api/certificates/permissions
// @desc    Get all certificates with their assigned interns for permissions page
// @access  Private/Admin
exports.getCertificatePermissions = async (req, res) => {
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
        console.error('Error fetching certificate permissions:', error);
        res.status(500).json({ success: false, message: 'Server error fetching permissions' });
    }
};

// @route   PUT /api/certificates/:id
// @desc    Update certificate metadata
// @access  Private/Admin
exports.updateCertificate = async (req, res) => {
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
        console.error('Error updating certificate:', error);
        res.status(500).json({ success: false, message: 'Server error updating certificate' });
    }
};

// @route   DELETE /api/certificates/:id
// @desc    Delete a certificate
// @access  Private/Admin
exports.deleteCertificate = async (req, res) => {
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
        console.error('Error deleting certificate:', error);
        res.status(500).json({ success: false, message: 'Server error deleting certificate' });
    }
};

// @route   PATCH /api/certificates/:id/visibility
// @desc    Toggle certificate visibility
// @access  Private/Admin
exports.toggleVisibility = async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        certificate.isVisible = !certificate.isVisible;
        await certificate.save();

        res.json({
            success: true,
            message: `Certificate visibility set to ${certificate.isVisible}`,
            data: certificate
        });
    } catch (error) {
        console.error('Error toggling visibility:', error);
        res.status(500).json({ success: false, message: 'Server error toggling visibility' });
    }
};

// @route   PATCH /api/certificates/:id/download
// @desc    Toggle certificate download permission
// @access  Private/Admin
exports.toggleDownload = async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        certificate.canDownload = !certificate.canDownload;
        await certificate.save();

        // If permission was granted and there is an assigned user, create a notification
        if (certificate.canDownload && certificate.assignedTo) {
            await Notification.create({
                userId: certificate.assignedTo,
                title: "Download Permission Enabled",
                message: `You can now download your "${certificate.title}" certificate.`,
                type: "certificate",
                certificateId: certificate._id
            });
        }

        res.json({
            success: true,
            message: `Certificate download permission set to ${certificate.canDownload}`,
            data: certificate
        });
    } catch (error) {
        console.error('Error toggling download permission:', error);
        res.status(500).json({ success: false, message: 'Server error toggling download' });
    }
};

// @route   GET /api/certificates/my-certificates
// @desc    Get certificates assigned to logged-in intern
// @access  Private/Intern
exports.getMyCertificates = async (req, res) => {
    try {
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
        console.error('Error fetching intern certificates:', error);
        res.status(500).json({ success: false, message: 'Server error fetching your certificates' });
    }
};

// @route   GET /api/certificates/download/:id
// @desc    Download a certificate file securely
// @access  Private/Intern
exports.downloadCertificate = async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
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
        console.error('Error downloading certificate:', error);
        res.status(500).json({ success: false, message: 'Server error during download' });
    }
};
