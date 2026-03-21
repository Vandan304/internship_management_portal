import React from 'react';
import { format } from 'date-fns';
import { Paperclip, Check } from 'lucide-react';
import { getFileUrl } from '../../utils/urlUtils';

const isEmojiOnly = (text) => {
    if (!text) return false;
    const stripped = text.replace(/\s/g, '');
    if (!stripped) return false;
    // Basic reliable way: check if it contains NO standard alphanumeric or punctuation chars usually typed.
    // Emojis often fall outside basic ASCII.
    return !/[a-zA-Z0-9\.,!?'"()/\\;:{}\[\]<>\-_+=@#$%^&*~`]/.test(stripped) && /^[\p{Emoji}\p{Emoji_Presentation}]+$/u.test(stripped);
};

const MessageBubble = ({ message, isOwnMessage, isSelectMode, isSelected, onSelect }) => {
    const emojiOnly = isEmojiOnly(message.messageText) && !message.fileUrl;
    
    return (
        <div
            className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 ${isSelectMode ? 'cursor-pointer hover:bg-gray-100/50 p-1 -mx-1 rounded-xl transition-colors' : ''}`}
            onClick={isSelectMode ? onSelect : undefined}
        >
            {isSelectMode && !isOwnMessage && (
                <div className="flex items-center justify-center mr-3 ml-2">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-gray-300'}`}>
                        {isSelected && <Check size={14} className="text-white" />}
                    </div>
                </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-2 flex flex-col relative
                ${emojiOnly ? 'bg-transparent text-gray-800 p-0' : isOwnMessage ? 'bg-brand-600 text-white rounded-br-none shadow-sm' : 'bg-gray-100 text-gray-800 rounded-bl-none shadow-sm'}
            `}>

                {message.fileUrl && (
                    <a
                        href={`http://localhost:5000/api/files/${message._id}?token=${localStorage.getItem('token')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${isOwnMessage ? 'bg-brand-700/50 hover:bg-brand-700' : 'bg-white hover:bg-gray-50'} transition-colors mt-1`}
                    >
                        <Paperclip size={16} className="flex-shrink-0" />
                        <span className="text-sm truncate max-w-[200px]">{message.fileUrl.split('-').pop()}</span>
                    </a>
                )}

                {message.messageText && (
                    <span className={`${emojiOnly ? 'text-4xl' : 'text-sm'} whitespace-pre-wrap break-words`}>{message.messageText}</span>
                )}

                <div className={`text-[10px] mt-1 flex items-center justify-end ${emojiOnly ? 'text-gray-400 font-medium' : isOwnMessage ? 'text-brand-100' : 'text-gray-500'}`}>
                    <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
                </div>
            </div>

            {isSelectMode && isOwnMessage && (
                <div className="flex items-center justify-center ml-3 mr-2">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-gray-300 bg-white'}`}>
                        {isSelected && <Check size={14} className="text-white" />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
