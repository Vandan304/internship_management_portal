const Certificate = require('../models/Certificate');
const path = require('path');
const fs = require('fs');

/**
 * Generic File Access Controller
 * This can be expanded to handle different models (Certificates, Tasks, etc.)
 */
exports.getFile = async (req, res, next) => {
    console.log('[API START] getFile');
    try {
        let fileRecord = await Certificate.findById(req.params.id);
        let resourcePath, storageType, assignedTo;
        if (fileRecord) {
            resourcePath = fileRecord.fileUrl;
            storageType = fileRecord.storageType;
            assignedTo = fileRecord.assignedTo;
        } else {
            const Permission = require('../models/Permission');
            const Task = require('../models/Task');
            
            let permissionRecord = await Permission.findById(req.params.id);
            if (permissionRecord) {
                resourcePath = permissionRecord.resourcePath;
                storageType = permissionRecord.storageType;
                assignedTo = permissionRecord.internId;
            } else {
                let taskRecord = await Task.findById(req.params.id);
                if (taskRecord) {
                    resourcePath = taskRecord.zipFile;
                    storageType = taskRecord.storageType;
                    assignedTo = taskRecord.assignedTo;
                } else {
                    const Message = require('../models/Message');
                    const messageRecord = await Message.findById(req.params.id);
                    if (!messageRecord) {
                        return res.status(404).json({ success: false, message: 'File record not found' });
                    }
                    resourcePath = messageRecord.fileUrl;
                    storageType = messageRecord.storageType;
                    // For chat, authorization is sender or receiver
                    const isChatAuthorized = req.user.role === 'admin' || 
                                             messageRecord.senderId.toString() === req.user.id || 
                                             messageRecord.receiverId.toString() === req.user.id;
                    if (!isChatAuthorized) {
                        return res.status(403).json({ success: false, message: 'Not authorized to access this chat file' });
                    }
                    // Skip general assignedTo check for chat as we did it above
                    assignedTo = req.user.id; 
                }
            }
        }

        // Authorization check: Admin or the assigned intern
        if (req.user.role !== 'admin' && assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this file' });
        }

        // Logic for S3
        if (storageType === 's3' || (resourcePath && resourcePath.startsWith('http'))) {
            console.log(`[FILE ACCESS] Redirecting to S3 ${resourcePath}`);
            return res.redirect(resourcePath);
        }

        // Logic for Local Fallback
        const filePath = path.join(__dirname, '..', resourcePath);
        if (!fs.existsSync(filePath)) {
            console.error(`[FILE ACCESS ERROR] local file not found: ${filePath}`);
            return res.status(404).json({ success: false, message: 'File not found on server' });
        }

        console.log(`[FILE ACCESS] Serving local file: ${filePath}`);
        res.sendFile(filePath);
    } catch (error) {
        console.error('[ERROR] getFile:', error.message);
        next(error);
    }
};
