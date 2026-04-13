import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { toast } from '../context/ToastContext';

const ChatPage = () => {
    const { user, socket } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserToChatWith, setSelectedUserToChatWith] = useState(null);

    const currentUserId = user?._id || user?.id;

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (!socket) return;

        // Use a stable handler for receiving messages
        const handleReceiveMessage = (message) => {
            // Only append to the messages list if it belongs to the active conversation
            if (activeConversation && message.conversationId === activeConversation._id) {
                setMessages(prev => {
                    const messageId = message._id || message.id;
                    if (prev.some(m => (m._id || m.id) === messageId)) return prev;
                    return [...prev, message];
                });
            }
            
            // Always update the sidebar with the last message received
            updateConversationLastMessage(message);
        };

        const handleNewMessageNotification = (message) => {
            // Show toast notification if not in the active conversation
            // Notice: we rely on the component closure for activeConversation._id
            // This is why we keep [socket, activeConversation?._id] as dependencies
            const senderName = typeof message.senderId === 'object' ? message.senderId.name : 'Someone';
            toast.success(`New message from ${senderName || 'a contact'}`);
            fetchConversations();
        };

        const handleTypingIndicator = ({ senderId, isTyping: typingStatus }) => {
            setIsTyping(typingStatus);
        };

        // Standard message receiving
        socket.on('receiveMessage', handleReceiveMessage);
        
        // Notifications for messages in other rooms
        socket.on('newMessageNotification', handleNewMessageNotification);
        
        // Typing indicator
        socket.on('typingIndicator', handleTypingIndicator);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
            socket.off('newMessageNotification', handleNewMessageNotification);
            socket.off('typingIndicator', handleTypingIndicator);
        };
    }, [socket, activeConversation?._id]); // Only re-subscribe if socket or active conversation ID changes

    const fetchConversations = async () => {
        try {
            const res = await axios.get('/api/chat/conversations');
            if (res.data.success) {
                setConversations(res.data.data);
                if (activeConversation) {
                    const updated = res.data.data.find(c => c._id === activeConversation._id);
                    if (updated) setActiveConversation(updated);
                }
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const res = await axios.get(`/api/chat/messages/${conversationId}`);
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const updateConversationLastMessage = (message) => {
        setConversations(prev => {
            let found = false;
            const updated = prev.map(conv => {
                if (conv._id === message.conversationId) {
                    found = true;
                    return { ...conv, lastMessage: message, updatedAt: message.createdAt };
                }
                return conv;
            });
            // Re-sort after map
            return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });
    };

    const handleSelectConversation = async (conversation) => {
        if (activeConversation && activeConversation._id === conversation._id) return;
        
        setActiveConversation(conversation);
        setMessages([]);
        setIsTyping(false);
        setSelectedUserToChatWith(null);

        if (!conversation.isNew) {
            fetchMessages(conversation._id);
            if (socket) {
                socket.emit('joinConversation', conversation._id);
            }
            
            // Mark messages as read
            try {
                await axios.patch(`/api/chat/messages/${conversation._id}/read`);
                // Update local conversation state unread count
                setConversations(prev => prev.map(conv => 
                    conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv
                ));
            } catch (error) {
                console.error("Failed to mark messages as read", error);
            }
        }
    };

    const handleSendMessage = async (text, file) => {
        try {
            let fileUrl = null;
            
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await axios.post('/api/chat/upload', formData);
                if (uploadRes.data.success) {
                    fileUrl = uploadRes.data.fileUrl;
                }
            }

            if (!activeConversation && !selectedUserToChatWith) return;

            // Find receiver ID
            let receiverId;
            if (activeConversation && !activeConversation.isNew) {
                const receiver = activeConversation.participants.find(p => p._id !== currentUserId);
                if(receiver) receiverId = receiver._id;
            } else if (selectedUserToChatWith) {
                receiverId = selectedUserToChatWith._id;
            }

            if (!receiverId) return;

            const res = await axios.post('/api/chat/send', {
                receiverId,
                messageText: text,
                fileUrl
            });

            if (res.data.success) {
                const newMessage = res.data.data;
                
                // If this was a new conversation
                if (activeConversation && activeConversation.isNew) {
                    await fetchConversations();
                    // Identify the newly created conversation
                    const newConvRes = await axios.get('/api/chat/conversations');
                    const createdConv = newConvRes.data.data.find(c => c._id === newMessage.conversationId);
                    if (createdConv) {
                        setActiveConversation(createdConv);
                        if (socket) socket.emit('joinConversation', createdConv._id);
                    }
                } else {
                    updateConversationLastMessage(newMessage);
                }
                
                setMessages(prev => {
                    // Prevent duplicate if socket or strict mode already added it
                    if (prev.some(m => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
                
                if (socket) {
                    socket.emit('sendMessage', newMessage);
                }
                
                setSelectedUserToChatWith(null);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleTyping = (isTypingStatus) => {
        if (socket && activeConversation && !activeConversation.isNew) {
            socket.emit('typing', {
                conversationId: activeConversation._id,
                senderId: currentUserId,
                isTyping: isTypingStatus
            });
        }
    };

    const fetchAvailableUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await axios.get('/api/chat/users');
            if (res.data.success) {
                setAvailableUsers(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch available users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleNewChat = () => {
        fetchAvailableUsers();
        setShowUsersModal(true);
    };

    const startChatWithUser = (selectedUser) => {
        setShowUsersModal(false);
        
        const existingConv = conversations.find(c => c.participants.some(p => p._id === selectedUser._id));
        
        if (existingConv) {
            handleSelectConversation(existingConv);
        } else {
            setActiveConversation({
                participants: [user, selectedUser],
                isNew: true
            });
            setMessages([]);
            setSelectedUserToChatWith(selectedUser);
        }
    };

    const handleDeleteMessages = async (messageIds) => {
        try {
            const res = await axios.delete('/api/chat/messages', {
                data: { messageIds }
            });
            if (res.data.success) {
                setMessages(prev => prev.filter(m => !messageIds.includes(m._id)));
                
                // If all current messages were deleted, clear the lastMessage from the conversation list
                setConversations(prev => prev.map(c => {
                    if (activeConversation && c._id === activeConversation._id) {
                        return { ...c, lastMessage: null };
                    }
                    return c;
                }));
                
                toast.success('Chat cleared successfully');
                return true;
            }
        } catch (error) {
            console.error('Failed to delete messages:', error);
            toast.error(error.response?.data?.message || 'Failed to delete messages');
            return false;
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] overflow-hidden bg-white shadow-soft rounded-2xl border border-gray-100">
            <div className={`w-full sm:w-80 flex-shrink-0 border-r border-gray-100 ${activeConversation ? 'hidden sm:block' : 'block'}`}>
                <ChatSidebar 
                    conversations={conversations} 
                    currentUserId={currentUserId} 
                    activeConversation={activeConversation}
                    onSelectConversation={handleSelectConversation}
                    onNewChat={handleNewChat}
                />
            </div>
            <div className={`flex-1 ${!activeConversation ? 'hidden sm:flex' : 'flex'}`}>
                <ChatWindow 
                    activeConversation={activeConversation}
                    currentUserId={currentUserId}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    isTyping={isTyping}
                    onBack={() => setActiveConversation(null)}
                    onDeleteMessages={handleDeleteMessages}
                />
            </div>

            {/* New Chat Modal */}
            {showUsersModal && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-soft overflow-hidden m-4">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-semibold text-gray-800">Start New Chat</h3>
                            <button onClick={() => setShowUsersModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-2 overflow-y-auto max-h-[60vh] flex-1">
                            {loadingUsers ? (
                                <div className="p-8 text-center text-gray-500">Loading users...</div>
                            ) : availableUsers.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No users available to chat with</div>
                            ) : (
                                availableUsers.map(u => (
                                    <div 
                                        key={u._id} 
                                        onClick={() => startChatWithUser(u)}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-xl transition-colors m-1"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold shadow-sm">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">{u.name}{u.internId ? ` (${u.internId})` : ''}</div>
                                            <div className="text-xs text-gray-500 capitalize">{u.role}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
