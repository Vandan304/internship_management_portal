const Certificate = require('../models/Certificate');
const Permission = require('../models/Permission');
const User = require('../models/User');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');
const pdfService = require('../services/pdfService');
const storageService = require('../utils/storageService');
const { deleteFromS3 } = require('../utils/s3Service'); // for backward compatibility in some places if needed, but storageService should handle it

exports.uploadCertificate = async (req, res, next) => {
    console.log('[API START] uploadCertificate');
    try {
        if (!req.file) {
            console.warn('[ERROR] No file uploaded');
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const { title, assignedTo } = req.body;
        console.log('[PARAMS]', `title: ${title}, assignedTo: ${assignedTo}`);

        if (!assignedTo) {
            return res.status(400).json({ success: false, message: 'Please specify an intern' });
        }

        const intern = await User.findById(assignedTo);
        if (!intern) {
            console.warn('[NOT FOUND] Intern not found');
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        const timestamp = Date.now();
        const prefix = (req.file.fieldname === 'certificate' || req.file.fieldname === 'file') ? 'certificate_' : 'offerletter_';
        const fileName = `${prefix}${assignedTo}_${timestamp}${path.extname(req.file.originalname)}`;

        // Use Storage Service with Fallback
        const { fileUrl, storageType } = await storageService.uploadFile(
            req.file.buffer,
            fileName,
            req.file.mimetype,
            'certificates'
        );

        // Update Certificate model
        const certificate = await Certificate.create({
            title: title || 'Manual Certificate',
            fileUrl,
            fileName: fileName,
            fileSize: req.file.size || 0,
            fileType: req.file.mimetype || 'application/pdf',
            storageType: storageType,
            uploadedBy: req.user.id,
            assignedTo: assignedTo
        });
        console.log('[DB CREATE SUCCESS] Certificate record created');

        // Update Intern document
        intern.certificatePath = fileUrl;
        intern.certificateAssigned = true;
        await intern.save();
        console.log('[DB UPDATE SUCCESS] Intern updated with certificate path');

        // Register in Permissions Module
        await Permission.create({
            internId: assignedTo,
            resourceType: 'certificate',
            resourceName: title || 'Internship Certificate',
            resourcePath: fileUrl,
            storageType: storageType,
            certificateId: certificate._id,
            visibilityEnabled: false,
            downloadEnabled: false
        });
        console.log('[DB CREATE SUCCESS] Permission entry created');

        // Create notification
        const notification = await Notification.create({
            userId: assignedTo,
            title: "New Certificate Uploaded",
            message: `Your certificate "${title}" has been uploaded by the admin.`,
            type: "certificate",
            certificateId: certificate._id
        });

        req.app.get('io').to(assignedTo.toString()).emit('newNotification', notification);
        req.app.get('io').to(assignedTo.toString()).emit('refreshCertificates');

        res.status(201).json({ success: true, certificate });
    } catch (error) {
        console.error('[ERROR] uploadCertificate:', error.stack);
        next(error);
    }
};

/**
 * MODULE 3 — COMPLETION CERTIFICATE GENERATION
 */
exports.generateCompletionCertificate = async (req, res, next) => {
    console.log('[API START] generateCompletionCertificate');
    try {
        const { internId, completionDate } = req.body;
        console.log('[PARAMS]', `internId: ${internId}, completionDate: ${completionDate}`);

        const intern = await User.findById(internId);
        if (!intern) {
            console.warn('[NOT FOUND] Intern not found');
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        // NEW: STRICT VALIDATION RULE - check loginAccess
        if (!intern.loginAccess) {
            return res.status(403).json({
                success: false,
                message: "Login access is not enabled for this intern. Certificate generation is not allowed."
            });
        }

        if (intern.certificateAssigned) {
            // Self-Healing: Check if the certificate actually exists in the database
            const existingCert = await Certificate.findOne({
                assignedTo: internId,
                title: { $regex: /Certificate$/i }
            });

            if (!existingCert) {
                console.log(`[SELF-HEALING] Resetting stale certificateAssigned flag for ${intern.name}`);
                intern.certificateAssigned = false;
                intern.certificatePath = null;
                await intern.save();
            } else {
                console.warn('[DUPLICATE] Completion Certificate already generated for this intern');
                return res.status(400).json({ success: false, message: 'Completion Certificate already generated for this intern.' });
            }
        }

        const firstName = intern.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `${firstName}_Completion_Certificate.pdf`;
        const certificatePath = `uploads/certificates/${fileName}`;

        // Format dates from User document or fallbacks
        const sDate = intern.startDate ? new Date(intern.startDate).toLocaleDateString() : 'N/A';
        const eDate = completionDate || (intern.endDate ? new Date(intern.endDate).toLocaleDateString() : new Date().toLocaleDateString());

        const templateData = {
            internName: intern.name,
            internId: intern.internId,
            position: (intern.internRole || 'Intern').toUpperCase(),
            startDate: sDate,
            completionDate: eDate
        };

        const template = pdfService.getCertificateTemplate(templateData);
        console.log('[FILE GENERATION START] Generating PDF Buffer...');

        const pdfBuffer = await pdfService.generatePDFBuffer(template);
        const fileSizeInBytes = pdfBuffer.length;

        // Use Storage Service with Fallback
        const { fileUrl, storageType } = await storageService.uploadFile(
            pdfBuffer,
            fileName,
            'application/pdf',
            'certificates'
        );
        console.log(`[FILE GENERATED] Stored at ${fileUrl} (${storageType})`);

        // Removed automatic cleanup to enforce manual deletion flow

        // Update Certificate model
        const certificate = await Certificate.create({
            title: `${firstName} Completion Certificate`,
            fileUrl,
            fileName: fileName,
            fileSize: fileSizeInBytes,
            fileType: 'application/pdf',
            storageType: storageType,
            uploadedBy: req.user.id,
            assignedTo: internId
        });

        // Update Intern document
        intern.certificatePath = fileUrl;
        intern.certificateAssigned = true;
        await intern.save();
        console.log('[DB UPDATE SUCCESS] Intern document updated');

        // Register in Permissions Module (Clean up old ones first for accuracy)
        await Permission.deleteMany({ internId: internId, resourceType: 'certificate' });

        // Register in Permissions Module
        await Permission.create({
            internId: internId,
            resourceType: 'certificate',
            resourceName: `${firstName} Completion Certificate`,
            resourcePath: fileUrl,
            storageType: storageType,
            certificateId: certificate._id,
            visibilityEnabled: false,
            downloadEnabled: false
        });
        console.log('[DB CREATE SUCCESS] Permission entry created');

        res.status(201).json({ success: true, message: 'Certificate generated successfully', data: certificate });
    } catch (error) {
        console.error('[ERROR] generateCompletionCertificate:', error.stack);
        next(error);
    }
};

exports.generateOfferLetter = async (req, res, next) => {
    console.log('[API START] generateOfferLetter');
    try {
        const { internId } = req.body;
        console.log('[PARAMS]', `internId: ${internId}`);

        const intern = await User.findById(internId);
        if (!intern) {
            console.warn('[NOT FOUND] Intern not found');
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        // NEW: STRICT VALIDATION RULE - check loginAccess
        if (!intern.loginAccess) {
            return res.status(403).json({
                success: false,
                message: "Login access is not enabled for this intern. Offer letter cannot be generated."
            });
        }

        if (intern.offerLetterAssigned) {
            // Self-Healing: Check if the offer letter actually exists in the database
            const existingOffer = await Certificate.findOne({
                assignedTo: internId,
                title: { $regex: /Offer Letter$/i }
            });

            if (!existingOffer) {
                console.log(`[SELF-HEALING] Resetting stale offerLetterAssigned flag for ${intern.name}`);
                intern.offerLetterAssigned = false;
                intern.offerLetterPath = null;
                await intern.save();
            } else {
                console.warn('[DUPLICATE] Offer Letter already generated for this intern');
                return res.status(400).json({ success: false, message: 'Offer Letter already generated for this intern.' });
            }
        }
        const firstName = intern.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `${firstName}_Offer_Letter.pdf`;
        const offerLetterPath = `uploads/offerletters/${fileName}`;

        const templateData = {
            internName: intern.name,
            internId: intern.internId,
            position: (intern.internRole || 'Intern').toUpperCase(),
            startDate: intern.startDate ? new Date(intern.startDate).toLocaleDateString() : new Date().toLocaleDateString()
        };

        const template = pdfService.getOfferLetterTemplate(templateData);
        console.log('[FILE GENERATION START] Generating PDF Buffer...');

        const pdfBuffer = await pdfService.generatePDFBuffer(template);
        const fileSizeInBytes = pdfBuffer.length;

        // Use Storage Service with Fallback
        const { fileUrl, storageType } = await storageService.uploadFile(
            pdfBuffer,
            fileName,
            'application/pdf',
            'offerletters'
        );
        console.log(`[FILE GENERATED] Stored at ${fileUrl} (${storageType})`);

        // Update Certificate model
        const certificate = await Certificate.create({
            title: `${firstName} Internship Offer Letter`,
            fileUrl,
            fileName: fileName,
            fileSize: fileSizeInBytes,
            fileType: 'application/pdf',
            storageType: storageType,
            uploadedBy: req.user.id,
            assignedTo: internId
        });

        // Update Intern document
        intern.offerLetterPath = fileUrl;
        intern.offerLetterAssigned = true;
        await intern.save();
        console.log('[DB UPDATE SUCCESS] Intern document updated');

        // Register in Permissions Module
        await Permission.deleteMany({ internId, resourceType: 'offerletter' });

        await Permission.create({
            internId: internId,
            resourceType: 'offerletter',
            resourceName: `${firstName} Offer Letter`,
            resourcePath: fileUrl,
            storageType: storageType,
            certificateId: certificate._id,
            visibilityEnabled: false,
            downloadEnabled: false
        });
        console.log('[DB CREATE SUCCESS] Permission entry created');

        res.status(201).json({ success: true, message: 'Offer letter generated successfully', data: certificate });
    } catch (error) {
        console.error('[ERROR] generateOfferLetter:', error.stack);
        next(error);
    }
};

/**
 * MODULE 4 — PERMISSIONS MANAGEMENT (ADMIN)
 */
exports.getCertificatePermissions = async (req, res, next) => {
    console.log('[API START] getCertificatePermissions');
    try {
        const permissions = await Permission.find()
            .populate('internId', 'name email')
            .sort({ createdAt: -1 });

        console.log(`[DB QUERY SUCCESS] Fetched ${permissions.length} permissions`);

        // Map to format expected by frontend
        const formatted = permissions.map(p => ({
            _id: p._id,
            title: p.resourceName,
            intern: p.internId,
            resourceType: p.resourceType,
            isVisible: p.visibilityEnabled,
            canDownload: p.downloadEnabled,
            resourcePath: p.resourcePath
        }));

        res.json({ success: true, certificates: formatted });
    } catch (error) {
        console.error('[ERROR] getCertificatePermissions:', error.message);
        next(error);
    }
};

exports.toggleVisibility = async (req, res, next) => {
    console.log('[API START] toggleVisibility');
    console.log('[PARAMS]', req.params.id);
    try {
        const permission = await Permission.findById(req.params.id);
        if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });

        permission.visibilityEnabled = !permission.visibilityEnabled;
        await permission.save();
        console.log(`[DB UPDATE SUCCESS] Visibility set to ${permission.visibilityEnabled}`);

        req.app.get('io').to(permission.internId.toString()).emit('refreshCertificates');
        res.json({ success: true, data: permission });
    } catch (error) {
        console.error('[ERROR] toggleVisibility:', error.message);
        next(error);
    }
};

exports.toggleDownload = async (req, res, next) => {
    console.log('[API START] toggleDownload');
    console.log('[PARAMS]', req.params.id);
    try {
        const permission = await Permission.findById(req.params.id);
        if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });

        permission.downloadEnabled = !permission.downloadEnabled;
        await permission.save();
        console.log(`[DB UPDATE SUCCESS] Download set to ${permission.downloadEnabled}`);

        req.app.get('io').to(permission.internId.toString()).emit('refreshCertificates');
        res.json({ success: true, data: permission });
    } catch (error) {
        console.error('[ERROR] toggleDownload:', error.message);
        next(error);
    }
};

/**
 * INTERN ACCESS
 */
exports.getMyCertificates = async (req, res, next) => {
    console.log('[API START] getMyCertificates');
    try {
        const permissions = await Permission.find({
            internId: req.user.id,
            visibilityEnabled: true
        }).sort({ createdAt: -1 });

        console.log(`[DB QUERY SUCCESS] Fetched ${permissions.length} visible resources`);

        const data = permissions.map(p => ({
            _id: p._id,
            id: p._id, // Providing both for maximum compatibility
            title: p.resourceName,
            fileUrl: p.resourcePath,
            fileName: p.resourcePath.split('/').pop(), // Extract e.g. "Manav_Offer_Letter.pdf"
            canDownload: p.downloadEnabled,
            resourceType: p.resourceType,
            createdAt: p.createdAt
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('[ERROR] getMyCertificates:', error.message);
        next(error);
    }
};

/**
 * SECURE FILE ACCESS (S3 Redirect or Local Serve)
 */
exports.viewCertificate = async (req, res, next) => {
    console.log('[API START] viewCertificate');
    try {
        const certificate = await Certificate.findById(req.params.id);
        if (!certificate) return res.status(404).json({ success: false, message: 'File record not found' });

        // Authorization check: Admin or the assigned intern
        if (req.user.role !== 'admin' && certificate.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this file' });
        }

        if (certificate.storageType === 's3' || (certificate.fileUrl && certificate.fileUrl.startsWith('http'))) {
            console.log(`[FILE VIEW] Redirecting to S3 ${certificate.fileUrl}`);
            return res.redirect(certificate.fileUrl);
        }

        // Local storage - serve file
        const filePath = path.join(__dirname, '..', certificate.fileUrl);
        if (!fs.existsSync(filePath)) {
            console.error(`[FILE VIEW ERROR] file not found on disk: ${filePath}`);
            return res.status(404).json({ success: false, message: 'File not found on server' });
        }

        console.log(`[FILE VIEW] Serving local file: ${filePath}`);
        res.sendFile(filePath);
    } catch (error) {
        console.error('[ERROR] viewCertificate:', error.message);
        next(error);
    }
};

exports.downloadCertificate = async (req, res, next) => {
    console.log('[API START] downloadCertificate');
    try {
        const permission = await Permission.findById(req.params.id);
        if (!permission) return res.status(404).json({ success: false, message: 'Permission record not found' });

        if (req.user.role !== 'admin' && permission.internId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (req.user.role === 'intern' && !permission.downloadEnabled) {
            return res.status(403).json({ success: false, message: 'Download is restricted' });
        }

        if (permission.resourcePath.startsWith('http')) {
            console.log(`[FILE DOWNLOAD] Redirecting to S3 ${permission.resourcePath}`);
            return res.redirect(permission.resourcePath);
        }

        const filePath = path.join(__dirname, '..', permission.resourcePath);
        if (!fs.existsSync(filePath)) {
            console.error(`[FILE DOWNLOAD ERROR] file not found on disk: ${filePath}`);
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        console.log(`[FILE DOWNLOAD] Serving ${filePath}`);
        res.download(filePath);
    } catch (error) {
        console.error('[ERROR] downloadCertificate:', error.message);
        next(error);
    }
};

// Other required methods for admin management
exports.updateCertificate = async (req, res, next) => {
    console.log('[API START] updateCertificate');
    try {
        const certificate = await Certificate.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });
        console.log('[DB UPDATE SUCCESS] Certificate updated');
        res.json({ success: true, data: certificate });
    } catch (error) {
        next(error);
    }
};

exports.getAllCertificates = async (req, res, next) => {
    console.log('[API START] getAllCertificates');
    try {
        const certificates = await Certificate.find().populate('assignedTo', 'name email').sort({ createdAt: -1 });
        console.log(`[DB QUERY SUCCESS] Fetched ${certificates.length} certificates`);
        res.json({ success: true, data: certificates });
    } catch (error) {
        next(error);
    }
};

exports.deleteCertificate = async (req, res, next) => {
    console.log('[API START] deleteCertificate');
    try {
        const certificate = await Certificate.findById(req.params.id);
        if (certificate) {
            // Use Storage Service to delete from either S3 or Local
            await storageService.deleteFile(certificate.fileUrl, certificate.storageType);

            // Identify document type and reset intern flags for regeneration
            if (certificate.assignedTo) {
                const intern = await User.findById(certificate.assignedTo);
                if (intern) {
                    let updated = false;
                    const fileUrl = (certificate.fileUrl || '').replace(/\\/g, '/'); // Normalize slashes
                    const title = (certificate.title || '').toLowerCase();

                    // Folder-based Detection (Highly Accurate fallback)
                    if (fileUrl.includes('/offerletters/') || title.includes('offer letter') || title.includes('offerletter')) {
                        intern.offerLetterAssigned = false;
                        intern.offerLetterPath = null;
                        updated = true;
                        console.log(`[REGEN ENABLED] Reset offerLetterAssigned for ${intern.name}`);
                    }

                    if (fileUrl.includes('/certificates/') || title.includes('certificate')) {
                        intern.certificateAssigned = false;
                        intern.certificatePath = null;
                        updated = true;
                        console.log(`[REGEN ENABLED] Reset certificateAssigned for ${intern.name}`);
                    }

                    if (updated) {
                        await intern.save();
                        console.log(`[DB UPDATE SUCCESS] Flags reset for intern ${intern.name}`);
                    }
                }
            }


            // Delete related permission
            await Permission.deleteMany({ resourcePath: certificate.fileUrl });
            await certificate.deleteOne();
            console.log('[DB DELETE SUCCESS] Certificate and related files deleted');
        }
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        console.error('[ERROR] deleteCertificate:', error.stack);
        next(error);
    }
};