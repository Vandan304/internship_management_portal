const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const uploadTasks = require('../middleware/taskUploadMiddleware');
const {
    createTask,
    getAllTasks,
    getInternTasks,
    submitTask,
    approveTask,
    rejectTask
} = require('../controllers/taskController');

// All routes require authentication
router.use(protect);

// Admin Routes
router.post('/', authorizeRoles('admin'), createTask);
router.get('/', authorizeRoles('admin'), getAllTasks);
router.patch('/:id/approve', authorizeRoles('admin'), approveTask);
router.patch('/:id/reject', authorizeRoles('admin'), rejectTask);

// Intern Routes
router.get('/my-tasks', authorizeRoles('intern'), getInternTasks);

// The multer middleware should be used before the submitTask controller
router.post('/:id/submit', authorizeRoles('intern'), uploadTasks.single('zipFile'), submitTask);

module.exports = router;
