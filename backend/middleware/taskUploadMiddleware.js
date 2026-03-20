const multer = require('multer');
const path = require('path');
// Use inline Memory Storage
const storage = multer.memoryStorage();

// File filter validation to only permit ZIP files
const fileFilter = (req, file, cb) => {
    // Array of allowed mime types for ZIP
    const allowedMimeTypes = [
        'application/zip',
        'application/x-zip-compressed',
        'multipart/x-zip'
    ];

    if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.zip')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only ZIP files are allowed for task submissions!'), false);
    }
};

// Initialize multer upload object
const uploadTasks = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50 MB maximum file size limit for ZIPs (can be adjusted)
    }
});

module.exports = uploadTasks;
