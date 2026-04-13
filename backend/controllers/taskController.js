const Task = require('../models/Task');
const User = require('../models/User');
const storageService = require('../utils/storageService');
const { sendDeadlineNotification } = require('../utils/notificationService');
const { sendPushNotification } = require('../utils/firebaseService');
const Notification = require('../models/Notification');

// @desc    Admin creates a new task
// @route   POST /api/tasks
// @access  Private/Admin
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, assignedTo, weekNumber, deadline } = req.body;

        if (!title || !description || !assignedTo || !weekNumber || !deadline) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const intern = await User.findById(assignedTo);
        if (!intern || intern.role !== 'intern') {
            return res.status(404).json({ success: false, message: 'Intern not found' });
        }

        const taskDeadline = new Date(deadline);
        taskDeadline.setHours(23, 59, 59, 999);

        const task = await Task.create({
            title,
            description,
            assignedTo,
            weekNumber,
            deadline: taskDeadline,
            createdBy: req.user._id
        });

        // Proactive Notification: Send email immediately upon assignment
        if (intern.email) {
            await sendDeadlineNotification(
                intern.email,
                intern.name,
                task.title,
                task.deadline,
                'assigned' // New type for initial assignment
            );
        }

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin views all tasks
// @route   GET /api/tasks
// @access  Private/Admin
exports.getAllTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find()
            .populate('assignedTo', 'name email internId')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        next(error);
    }
};

// @desc    Intern views assigned tasks
// @route   GET /api/tasks/my-tasks
// @access  Private/Intern
exports.getInternTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user._id })
            .populate('createdBy', 'name')
            .sort({ deadline: 1 });

        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        next(error);
    }
};

// @desc    Intern submits a task (uploads ZIP)
// @route   POST /api/tasks/:id/submit
// @access  Private/Intern
exports.submitTask = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a ZIP file' });
        }

        const taskId = req.params.id;
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (task.deadline && new Date() > new Date(task.deadline)) {
            return res.status(400).json({ success: false, message: 'Deadline has passed. You can no longer submit this task.' });
        }

        // Check if the user is the one assigned to the task
        if (task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to submit this task' });
        }

        // File path logic mapped up to S3 directly via storageService
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const finalFileName = `${uniqueSuffix}-${cleanOriginalName}`;

        const uploadResult = await storageService.uploadFile(req.file.buffer, finalFileName, req.file.mimetype, 'tasks');

        // Cleanup pre-existing zipFile physically located in S3 or Local
        if (task.zipFile) {
            console.log(`[CLEANUP] Removing old task submission: ${task.zipFile}`);
            await storageService.deleteFile(task.zipFile, task.storageType);
        }

        task.zipFile = uploadResult.fileUrl;
        task.fileName = finalFileName;
        task.storageType = uploadResult.storageType;
        task.status = 'submitted';
        task.submittedAt = Date.now();

        await task.save();

        res.status(200).json({ success: true, message: 'Task submitted successfully', data: task });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin approves a task
// @route   PATCH /api/tasks/:id/approve
// @access  Private/Admin
exports.approveTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        task.status = 'approved';
        task.reviewedAt = Date.now();
        task.reviewComment = req.body.comment || null;

        // --- LEADERBOARD LOGIC: AWARD POINTS ---
        if (!task.pointsAwarded) {
            const intern = await User.findById(task.assignedTo);
            if (intern) {
                let pointsToAdd = 10; // Base points for approval
                
                // Early submission bonus (+5)
                if (task.submittedAt && task.deadline && new Date(task.submittedAt) <= new Date(task.deadline)) {
                    pointsToAdd += 5;
                }
                
                intern.points = (intern.points || 0) + pointsToAdd;
                await intern.save();
                task.pointsAwarded = true;
            }
        }

        await task.save();

        res.status(200).json({ success: true, message: 'Task approved successfully', data: task });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin rejects a task
// @route   PATCH /api/tasks/:id/reject
// @access  Private/Admin
exports.rejectTask = async (req, res, next) => {
    try {
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ success: false, message: 'Review comment is required for rejection' });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        task.status = 'rejected';
        task.reviewedAt = Date.now();
        task.reviewComment = comment;

        // --- PENALTY LOGIC: DEDUCT POINTS ---
        const intern = await User.findById(task.assignedTo);
        if (intern) {
            intern.points = (intern.points || 0) - 5;
            if (intern.points < 0) {
                intern.points = 0; // Prevent score from going below 0
            }
            await intern.save();
        }

        await task.save();

        res.status(200).json({ success: true, message: 'Task rejected and 5 points deducted', data: task });
    } catch (error) {
        next(error);
    }
};
// @desc    Admin updates a task deadline
// @route   PATCH /api/tasks/:id/deadline
// @access  Private/Admin
exports.updateTaskDeadline = async (req, res, next) => {
    try {
        const { deadline } = req.body;
        if (!deadline) {
            return res.status(400).json({ success: false, message: 'Please provide a new deadline' });
        }

        const task = await Task.findById(req.params.id).populate('assignedTo');
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const oldDeadline = new Date(task.deadline);
        const newDeadline = new Date(deadline);
        newDeadline.setHours(23, 59, 59, 999);

        const isIncreased = newDeadline > oldDeadline;
        
        // 1. Update Task in DB
        task.deadline = newDeadline;
        task.overdueNotified = false; // Reset if it was overdue
        await task.save();

        // 2. Clear stale pending notifications for this task
        await Notification.deleteMany({ taskId: task._id, status: 'pending' });

        // 3. Send immediate notifications (Email + Push)
        const intern = task.assignedTo;
        if (intern) {
            // A) Email
            if (intern.email) {
                await sendDeadlineNotification(
                    intern.email,
                    intern.name,
                    task.title,
                    { date: newDeadline, isIncreased }, 
                    'deadline_updated',
                    { userId: intern._id, taskId: task._id }
                );
            }

            // B) Push Notification
            if (intern.fcmToken) {
                await sendPushNotification(
                    intern.fcmToken,
                    isIncreased ? '📅 Deadline Extended' : '📅 Deadline Decreased',
                    `The deadline for "${task.title}" has been ${isIncreased ? 'extended' : 'decreased'} to ${newDeadline.toLocaleDateString()}.`,
                    { userId: intern._id, taskId: task._id, type: 'deadline_updated' }
                );
            }
        }

        res.status(200).json({ 
            success: true, 
            message: `Deadline ${isIncreased ? 'increased' : 'decreased'} successfully`, 
            data: task 
        });
    } catch (error) {
        next(error);
    }
};
