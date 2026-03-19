const Task = require('../models/Task');
const User = require('../models/User');

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

        const task = await Task.create({
            title,
            description,
            assignedTo,
            weekNumber,
            deadline,
            createdBy: req.user._id
        });

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

        // Check if the user is the one assigned to the task
        if (task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to submit this task' });
        }

        // File path logic based on multer logic
        // File URL relative path e.g., /uploads/tasks/filename.zip
        const fileUrl = `/uploads/tasks/${req.file.filename}`;

        task.zipFile = fileUrl;
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

        await task.save();

        res.status(200).json({ success: true, message: 'Task rejected', data: task });
    } catch (error) {
        next(error);
    }
};
