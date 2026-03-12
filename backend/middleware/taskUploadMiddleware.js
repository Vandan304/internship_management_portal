const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../uploads/tasks');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory Storage vs Disk Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Unique prefix: timestamp + random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        // Sanitize the original file name
        const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Final filename: <unique>-<cleanOriginalName>
        cb(null, uniqueSuffix + '-' + cleanOriginalName);
    }
});

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
