import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { MoreVertical, Phone, Video, ArrowLeft, CheckSquare, Trash2, X } from 'lucide-react';

const ChatWindow = ({ activeConversation, currentUserId, messages, onSendMessage, onTyping, isTyping, onBack, onDeleteMessages }) => {
    const messagesEndRef = useRef(null);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState([]);

    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        setSelectedMessageIds([]);
    };

    const toggleMessageSelection = (messageId) => {
        if (!isSelectMode) return;
        setSelectedMessageIds(prev => 
            prev.includes(messageId) 
                ? prev.filter(id => id !== messageId)
                : [...prev, messageId]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedMessageIds.length === 0) return;
        const success = await onDeleteMessages(selectedMessageIds);
        if (success) {
            setIsSelectMode(false);
            setSelectedMessageIds([]);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    if (!activeConversation) {
        return (
            <div className="flex-1 bg-gray-50 flex items-center justify-center flex-col text-gray-500 h-full">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-soft mb-4 border border-gray-100">
                    <span className="text-2xl">👋</span>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">Welcome to InternFlow Chat</h3>
                <p className="text-sm">Select a conversation or start a new one to begin</p>
            </div>
        );
    }

    const otherUser = activeConversation.participants.find(p => p._id !== currentUserId);

    return (
        <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
            {/* Header */}
            <div className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-sm z-10 w-full">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="sm:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold shadow-sm flex-shrink-0">
                        {otherUser?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 leading-tight truncate">{otherUser?.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{otherUser?.role === 'admin' ? 'Administrator' : 'Intern'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    {isSelectMode ? (
                        <>
                            <span className="text-sm font-medium text-brand-600">
                                {selectedMessageIds.length} selected
                            </span>
                            {selectedMessageIds.length > 0 && (
                                <button 
                                    onClick={handleDeleteSelected}
                                    className="hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50 text-red-500 shadow-sm"
                                    title="Delete Selected"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button 
                                onClick={toggleSelectMode}
                                className="hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 flex items-center gap-1 shadow-sm"
                                title="Cancel Selection"
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={toggleSelectMode}
                                className="hover:text-brand-600 transition-colors p-2 rounded-full hover:bg-brand-50"
                                title="Select Messages"
                            >
                                <CheckSquare size={20} />
                            </button>
                            <button className="hover:text-brand-600 transition-colors p-2 rounded-full hover:bg-brand-50"><Phone size={20} /></button>
                            <button className="hover:text-brand-600 transition-colors p-2 rounded-full hover:bg-brand-50"><Video size={20} /></button>
                            <button className="hover:text-brand-600 transition-colors p-2 rounded-full hover:bg-brand-50"><MoreVertical size={20} /></button>
                        </>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth w-full relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm relative z-10">
                        No messages yet. Say hello!
                    </div>
                ) : (
                    <div className="flex flex-col relative z-10 min-h-full justify-end">
                        {messages.map((msg, index) => {
                            const showDate = index === 0 || 
                                new Date(messages[index-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                                
                            const isOwnMsg = msg.senderId === currentUserId || msg.senderId?._id === currentUserId;
                                
                            return (
                                <React.Fragment key={msg._id || index}>
                                    {showDate && (
                                        <div className="w-full flex justify-center my-6">
                                            <span className="px-3 py-1 bg-white border border-gray-100 text-gray-500 text-xs font-medium rounded-full shadow-sm">
                                                {new Date(msg.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric'})}
                                            </span>
                                        </div>
                                    )}
                                    <MessageBubble 
                                        message={msg} 
                                        isOwnMessage={isOwnMsg} 
                                        isSelectMode={isSelectMode}
                                        isSelected={selectedMessageIds.includes(msg._id)}
                                        onSelect={() => toggleMessageSelection(msg._id)}
                                    />
                                </React.Fragment>
                            );
                        })}
                        {isTyping && (
                            <div className="flex justify-start mb-4">
                                <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 rounded-bl-none text-gray-500 flex items-center gap-1.5 shadow-sm max-w-[80px]">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} />
        </div>
    );
};

export default ChatWindow;
