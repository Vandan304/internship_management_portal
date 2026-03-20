const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { encryptMessage, decryptMessage } = require('../utils/encryption');
const storageService = require('../utils/storageService');
const fs = require('fs');
const path = require('path');

// GET /api/chat/users
exports.getChatUsers = async (req, res, next) => {
    try {
        const currentUser = req.user;
        let users;
        
        if (currentUser.role === 'admin') {
            users = await User.find({ role: 'intern', isActive: true })
                .select('name email role internId');
        } else {
            users = await User.find({ 
                _id: { $ne: currentUser.id },
                isActive: true 
            }).select('name email role internId');
        }
        
        res.status(200).json({ success: true, count: users?.length, data: users });
    } catch (error) {
        next(error);
    }
};

// GET /api/chat/conversations
exports.getConversations = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({ participants: userId })
            .populate('participants', 'name email role internId')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .lean(); // Use lean to easily modify the objects
            
        // Fetch unread message counts for each conversation
        for (let conv of conversations) {
            const unreadCount = await Message.countDocuments({
                conversationId: conv._id,
                receiverId: userId,
                isRead: false
            });
            conv.unreadCount = unreadCount;

            // Decrypt last message if it exists
            if (conv.lastMessage && conv.lastMessage.encryptedMessage) {
                conv.lastMessage.messageText = decryptMessage(
                    conv.lastMessage.encryptedMessage, 
                    conv.lastMessage.iv
                );
            }
        }
            
        res.status(200).json({ success: true, count: conversations.length, data: conversations });
    } catch (error) {
        next(error);
    }
};

// GET /api/chat/messages/:conversationId
exports.getMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .lean();
            
        // Decrypt messages before sending to client
        const decryptedMessages = messages.map(msg => {
            if (msg.encryptedMessage) {
                msg.messageText = decryptMessage(msg.encryptedMessage, msg.iv);
            }
            return msg;
        });
            
        res.status(200).json({ success: true, count: decryptedMessages.length, data: decryptedMessages });
    } catch (error) {
        next(error);
    }
};

// POST /api/chat/send
exports.sendMessage = async (req, res, next) => {
    try {
        const { receiverId, messageText, fileUrl } = req.body;
        const senderId = req.user.id;
        
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });
        
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        // Encrypt message text
        const { encryptedMessage, iv, algorithm } = encryptMessage(messageText);
        
        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            receiverId,
            messageText: '', // Don't store plain text
            encryptedMessage,
            iv,
            algorithm,
            fileUrl
        });
        
        conversation.lastMessage = message._id;
        await conversation.save();
        
        // Populate the sender details to return to the client
        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'name')
            .populate('receiverId', 'name')
            .lean();

        // Decrypt for the response
        if (populatedMessage.encryptedMessage) {
            populatedMessage.messageText = decryptMessage(
                populatedMessage.encryptedMessage, 
                populatedMessage.iv
            );
        }

        res.status(201).json({ success: true, data: populatedMessage });
    } catch (error) {
        next(error);
    }
};

// POST /api/chat/upload
exports.uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }
        
        const finalFileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
        const uploadResult = await storageService.uploadFile(req.file.buffer, finalFileName, req.file.mimetype, 'chat');

        res.status(200).json({ success: true, fileUrl: uploadResult.fileUrl, storageType: uploadResult.storageType });
    } catch (error) {
        next(error);
    }
};
// PATCH /api/chat/messages/:conversationId/read
exports.markMessagesAsRead = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user.id;

        await Message.updateMany(
            { conversationId, receiverId: currentUserId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/chat/messages
exports.deleteMessages = async (req, res, next) => {
    try {
        const { messageIds } = req.body;
        
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide message IDs to delete' });
        }
        
        const currentUserId = req.user.id;
        
        // Fetch the messages
        const messages = await Message.find({ _id: { $in: messageIds } });
        
        if (messages.length === 0) {
            return res.status(404).json({ success: false, message: 'No messages found' });
        }
        
        // Authorize: Admin can delete any, but user can only delete their own sent messages.
        const isAuthorized = req.user.role === 'admin' || messages.every(msg => msg.senderId.toString() === currentUserId);
        
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete these messages. You can only delete your own.' });
        }
        
        for (const msg of messages) {
            if (msg.fileUrl) {
                await storageService.deleteFile(msg.fileUrl, msg.storageType);
            }
        }
        
        await Message.deleteMany({ _id: { $in: messageIds } });
        
        res.status(200).json({ success: true, message: 'Messages deleted successfully' });
    } catch (error) {
        next(error);
    }
};

