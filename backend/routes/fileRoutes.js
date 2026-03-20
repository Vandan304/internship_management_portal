const express = require('express');
const router = express.Router();
const { getFile } = require('../controllers/fileController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/errorMiddleware');

// Route for accessing any file by its database ID
// Logic: If on S3, redirect. If local, check for its physical presence and serve.
router.get('/:id', protect, authorizeRoles('admin', 'intern'), validateObjectId, getFile);

module.exports = router;