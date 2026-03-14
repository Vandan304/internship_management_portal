import React from 'react';
import { format } from 'date-fns';
import { Paperclip } from 'lucide-react';

const MessageBubble = ({ message, isOwnMessage }) => {
    return (
        <div className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2 flex flex-col ${isOwnMessage ? 'bg-brand-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'} shadow-sm`}>
                
                {message.fileUrl && (
                    <a 
                        href={`http://localhost:5000${message.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${isOwnMessage ? 'bg-brand-700/50 hover:bg-brand-700' : 'bg-white hover:bg-gray-50'} transition-colors mt-1`}
                    >
                        <Paperclip size={16} className="flex-shrink-0" />
                        <span className="text-sm truncate max-w-[200px]">{message.fileUrl.split('-').pop()}</span>
                    </a>
                )}
                
                {message.messageText && (
                    <span className="text-sm whitespace-pre-wrap break-words">{message.messageText}</span>
                )}
                
                <div className={`text-[10px] mt-1 flex items-center justify-end ${isOwnMessage ? 'text-brand-100' : 'text-gray-500'}`}>
                    <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
