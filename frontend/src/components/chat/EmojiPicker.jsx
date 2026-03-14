import React from 'react';
import Picker from 'emoji-picker-react';

const EmojiPicker = ({ onEmojiSelect }) => {
    return (
        <div className="absolute bottom-16 left-0 z-50 shadow-soft">
            <Picker 
                onEmojiClick={(emojiObject) => onEmojiSelect(emojiObject.emoji)} 
                lazyLoadEmojis={true}
                searchPlaceholder="Search emoji..."
                width={300}
                height={400}
            />
        </div>
    );
};

export default EmojiPicker;
