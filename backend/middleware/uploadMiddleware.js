const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
    'uploads/certificates',
    'uploads/offerletters'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[DIRECTORY CREATED] ${dir}`);
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'certificate' || file.fieldname === 'file') {
            cb(null, 'uploads/certificates/');
        } else if (file.fieldname === 'offerletter') {
            cb(null, 'uploads/offerletters/');
        } else {
            cb(null, 'uploads/');
        }
    },
    filename: function (req, file, cb) {
        const internId = req.body.assignedTo || req.body.internId || req.params.internId || 'unknown';
        const prefix = (file.fieldname === 'certificate' || file.fieldname === 'file') ? 'certificate_' : 'offerletter_';
        cb(null, `${prefix}${internId}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

module.exports = upload;
