import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

const MessageInput = ({ onSendMessage, onTyping }) => {
    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() || selectedFile) {
            onSendMessage(message, selectedFile);
            setMessage('');
            setSelectedFile(null);
            setShowEmojiPicker(false);
            onTyping(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleChange = (e) => {
        setMessage(e.target.value);
        
        // Handle typing indicator
        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    };

    return (
        <div className="border-t border-gray-100 p-4 bg-white relative">
            {selectedFile && (
                <div className="mb-2 flex items-center gap-2 bg-gray-50 p-2 rounded-lg w-fit max-w-[80%] border border-gray-100 shadow-sm">
                    <Paperclip size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
                    <button type="button" onClick={removeFile} className="text-gray-400 hover:text-red-500 transition-colors ml-2">
                        <X size={16} />
                    </button>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
                <div ref={pickerRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2 transition-colors rounded-full hover:bg-gray-50 ${showEmojiPicker ? 'text-brand-600 bg-brand-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Smile size={24} />
                    </button>
                    
                    {showEmojiPicker && (
                        <EmojiPicker onEmojiSelect={(emoji) => setMessage(prev => prev + emoji)} />
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <Paperclip size={24} />
                </button>
                
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />

                <input
                    type="text"
                    value={message}
                    onChange={handleChange}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
                />

                <button
                    type="submit"
                    disabled={!message.trim() && !selectedFile}
                    className="p-2.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;
