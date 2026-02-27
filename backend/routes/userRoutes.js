const express = require('express');
const router = express.Router();
const { updateProfile } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Route specifically for interns to update their own profile
router.put('/update-profile', protect, authorizeRoles('intern'), updateProfile);

module.exports = router;
