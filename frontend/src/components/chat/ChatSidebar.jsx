import React, { useState } from 'react';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ChatSidebar = ({ conversations, currentUserId, activeConversation, onSelectConversation, onNewChat }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredConversations = conversations.filter(conv => {
        const otherUser = conv.participants.find(p => p._id !== currentUserId);
        return otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="w-full border-r border-gray-100 bg-white flex flex-col h-full">
            <div className="p-4 border-b border-gray-50 flex flex-col gap-4 shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                    <button
                        onClick={onNewChat}
                        className="p-2 bg-brand-50 text-brand-600 rounded-full hover:bg-brand-100 transition-colors shadow-sm"
                        title="Start new chat"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm text-gray-700 focus:outline-none"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <MessageCircle size={32} className="text-gray-300 mb-3" />
                        <p className="text-sm">No conversations found</p>
                        <button onClick={onNewChat} className="text-brand-600 text-sm font-medium mt-2 hover:underline">
                            Start a new chat
                        </button>
                    </div>
                ) : (
                    filteredConversations.map(conv => {
                        const otherUser = conv.participants.find(p => p._id !== currentUserId);
                        const isActive = activeConversation?._id === conv._id;

                        return (
                            <div
                                key={conv._id}
                                onClick={() => onSelectConversation(conv)}
                                className={`p-4 border-b border-gray-50 w-full cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 ${isActive ? 'bg-brand-50/50 relative' : ''}`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-r-full" />
                                )}
                                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold flex-shrink-0 text-lg shadow-sm">
                                    {otherUser?.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-gray-800 truncate pr-2">{otherUser?.name}</h3>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            {conv.lastMessage && (
                                                <span className="text-[10px] font-medium text-gray-400">
                                                    {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                                                </span>
                                            )}
                                            {conv.unreadCount > 0 && (
                                                <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {conv.lastMessage ? (
                                            conv.lastMessage.messageText || (conv.lastMessage.fileUrl ? '📎 File attached' : 'No messages yet')
                                        ) : 'Start a conversation'}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
