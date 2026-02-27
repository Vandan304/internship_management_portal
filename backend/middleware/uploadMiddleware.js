const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../uploads/certificates');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory Storage vs Disk Storage
// We will use Disk Storage to save files securely to the server with unique names
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Unique prefix: timestamp + random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        // Sanitize the original file name to avoid path traversal or weird bugs
        const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Final filename: <unique>-<cleanOriginalName>
        cb(null, uniqueSuffix + '-' + cleanOriginalName);
    }
});

// File filter validation to only permit specific Extensions
const fileFilter = (req, file, cb) => {
    // Array of allowed mime types
    const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, PNG, JPG, and JPEG are allowed!'), false);
    }
};

// Initialize multer upload object
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB maximum file size limit
    }
});

module.exports = upload;
