const Certificate = require('../models/Certificate');
const CertificatePermission = require('../models/CertificatePermission');
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
        if (!title) {
            return res.status(400).json({ success: false, message: 'Please provide a title for the certificate' });
        }

        // 3. Verify the assigned intern exists if assignedTo is provided
        let intern = null;
        if (assignedTo) {
            intern = await User.findById(assignedTo);
            if (!intern) {
                return res.status(404).json({ success: false, message: 'Assigned intern not found' });
            }
            if (intern.role !== 'intern') {
                return res.status(400).json({ success: false, message: 'Certificates can only be assigned to interns' });
            }
        }

        // 4. Construct file URL
        const fileUrl = `/uploads/certificates/${req.file.filename}`;

        // 5. Create the Certificate record in DB
        const certificate = await Certificate.create({
            title,
            fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size || 0,
            fileType: req.file.mimetype || 'application/pdf',
            uploadedBy: req.user.id, // Comes from authMiddleware (Admin)
            assignedTo: assignedTo || null
        });

        // 6. If assigned, create a CertificatePermission and send notification
        if (assignedTo) {
            await CertificatePermission.create({
                certificate: certificate._id,
                intern: assignedTo,
                isVisible: isVisible === 'true' || isVisible === true || false,
                canDownload: canDownload === 'true' || canDownload === true || false
            });

            // Create notification for the assigned intern
            const notification = await Notification.create({
                userId: assignedTo,
                title: "New Certificate Assigned",
                message: `You have been assigned the "${title}" certificate.`,
                type: "certificate",
                certificateId: certificate._id
            });

            // Emit real-time socket event
            req.app.get('io').to(assignedTo.toString()).emit('newNotification', notification);
            req.app.get('io').to(assignedTo.toString()).emit('refreshCertificates');
        }

        // 7. Return success response
        res.status(201).json({
            success: true,
            certificate
        });

    } catch (error) {
        next(error);
    }
};

// @route   GET /api/certificates
// @desc    Get all certificates (Admin File Management)
// @access  Private/Admin
exports.getAllCertificates = async (req, res, next) => {
    try {
        const certificates = await Certificate.find()
            .populate('assignedTo', 'name email')
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 })
            .lean(); // Faster to use .lean() here

        // Add an assignedCount since we only have single-assignment right now
        const formattedCertificates = certificates.map(cert => ({
            ...cert,
            assignedCount: cert.assignedTo ? 1 : 0
        }));

        res.json({
            success: true,
            count: formattedCertificates.length,
            data: formattedCertificates
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/certificates/permissions
// @desc    Get all active certificate permissions (Admin Access Control)
// @access  Private/Admin
exports.getCertificatePermissions = async (req, res, next) => {
    try {
        const permissions = await CertificatePermission.find()
            .populate('certificate', 'title fileName createdAt')
            .populate('intern', 'name email')
            .sort({ assignedAt: -1 });

        // Map to expected response format
        const formattedPermissions = permissions.map(perm => {
            return {
                _id: perm.certificate ? perm.certificate._id : null, // keep backward compat
                permissionId: perm._id,
                title: perm.certificate ? perm.certificate.title : 'Deleted Certificate',
                intern: perm.intern ? {
                    _id: perm.intern._id,
                    name: perm.intern.name,
                    email: perm.intern.email
                } : null,
                isVisible: perm.isVisible,
                canDownload: perm.canDownload
            };
        }).filter(p => p._id && p.intern); // filter out invalid/dangling refs

        res.json({
            success: true,
            certificates: formattedPermissions // still using 'certificates' key for frontend backward config
        });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/certificates/:id
// @desc    Update certificate metadata (File Management only)
// @access  Private/Admin
exports.updateCertificate = async (req, res, next) => {
    try {
        const { title } = req.body;

        let certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        certificate = await Certificate.findByIdAndUpdate(
            req.params.id,
            { title: title || certificate.title },
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

        // Delete associated permissions first
        await CertificatePermission.deleteMany({ certificate: certificate._id });

        // Delete the certificate
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
        // Here we rely on the fact that an intern is assigned to a certificate mapping uniquely
        const permission = await CertificatePermission.findOne({ certificate: req.params.id });

        if (!permission) {
            return res.status(404).json({ success: false, message: 'Certificate permission record not found' });
        }

        permission.isVisible = !permission.isVisible;
        await permission.save();

        if (permission.intern) {
            req.app.get('io').to(permission.intern.toString()).emit('refreshCertificates');
        }

        res.json({
            success: true,
            message: `Certificate visibility set to ${permission.isVisible}`,
            data: permission
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
        const permission = await CertificatePermission.findOne({ certificate: req.params.id });

        if (!permission) {
            return res.status(404).json({ success: false, message: 'Certificate permission record not found' });
        }

        permission.canDownload = !permission.canDownload;
        await permission.save();

        const certificate = await Certificate.findById(req.params.id);

        // If permission was granted, create a notification
        if (permission.canDownload && permission.intern && certificate) {
            const notification = await Notification.create({
                userId: permission.intern,
                title: "Download Permission Enabled",
                message: `You can now download your "${certificate.title}" certificate.`,
                type: "certificate",
                certificateId: certificate._id
            });
            req.app.get('io').to(permission.intern.toString()).emit('newNotification', notification);
        }

        if (permission.intern) {
            req.app.get('io').to(permission.intern.toString()).emit('refreshCertificates');
        }

        res.json({
            success: true,
            message: `Certificate download permission set to ${permission.canDownload}`,
            data: permission
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

        // Find active permissions mapped to this intern that are visible
        const permissions = await CertificatePermission.find({
            intern: req.user.id,
            isVisible: true
        }).populate({
            path: 'certificate',
            select: 'title fileUrl fileName fileSize fileType createdAt'
        }).sort({ assignedAt: -1 });

        // Map to expected structure so frontend doesn't break
        const certificates = permissions
            .filter(p => p.certificate) // Ensure certificate document exists
            .map(p => ({
                _id: p.certificate._id,
                title: p.certificate.title,
                fileUrl: p.certificate.fileUrl,
                fileName: p.certificate.fileName,
                fileSize: p.certificate.fileSize,
                fileType: p.certificate.fileType,
                createdAt: p.certificate.createdAt,
                canDownload: p.canDownload
            }));

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
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized. User information missing.' });
        }

        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        // Check permissions instead of just certificate fields
        const permission = await CertificatePermission.findOne({
            certificate: req.params.id,
            intern: req.user.id
        });

        // 1. Verify ownership (Must have a permission record)
        if (!permission) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this certificate' });
        }

        // 2. Verify download permission and visibility
        if (!permission.isVisible) {
            return res.status(403).json({ success: false, message: 'Certificate is not visible' });
        }
        if (!permission.canDownload) {
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
