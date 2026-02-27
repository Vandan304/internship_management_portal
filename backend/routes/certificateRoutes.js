const express = require('express');
const router = express.Router();
const {
    uploadCertificate,
    getAllCertificates,
    updateCertificate,
    deleteCertificate,
    toggleVisibility,
    toggleDownload,
    getMyCertificates,
    downloadCertificate,
    getCertificatePermissions
} = require('../controllers/certificateController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateObjectId } = require('../middleware/errorMiddleware');

// Apply protection to all certificate routes
router.use(protect);

// Admin-only route for uploading certificates
// Uses the upload middleware to expect a single file field named 'file'
router.post(
    '/upload',
    authorizeRoles('admin'),
    upload.single('file'),
    uploadCertificate
);

// Intern-only route
router.get('/my-certificates', authorizeRoles('intern'), getMyCertificates);
router.get('/download/:id', validateObjectId, authorizeRoles('intern'), downloadCertificate);

// General Admin Routes (MUST be below specific paths like /my-certificates)
router.get('/permissions', authorizeRoles('admin'), getCertificatePermissions);
router.get('/', authorizeRoles('admin'), getAllCertificates);
router.put('/:id', validateObjectId, authorizeRoles('admin'), updateCertificate);
router.delete('/:id', validateObjectId, authorizeRoles('admin'), deleteCertificate);
router.patch('/:id/visibility', validateObjectId, authorizeRoles('admin'), toggleVisibility);
router.patch('/:id/download', validateObjectId, authorizeRoles('admin'), toggleDownload);

module.exports = router;
