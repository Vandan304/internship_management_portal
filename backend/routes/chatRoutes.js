const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, uploadFile, getChatUsers, markMessagesAsRead } = require('../controllers/chatController');
const chatUpload = require('../middleware/chatUploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/users').get(getChatUsers);
router.route('/conversations').get(getConversations);
router.route('/messages/:conversationId').get(getMessages);
router.route('/messages/:conversationId/read').patch(markMessagesAsRead);
router.route('/send').post(sendMessage);
router.route('/upload').post(chatUpload.single('file'), uploadFile);

module.exports = router;
