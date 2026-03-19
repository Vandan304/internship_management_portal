const crypto = require('crypto');

// AES-256-CBC configuration
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY;
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts plain text using AES-256-CBC
 * @param {string} text - The plain text to encrypt
 * @returns {object} - { encryptedMessage: string, iv: string, algorithm: string }
 */
const encryptMessage = (text) => {
    try {
        if (!text) return { encryptedMessage: '', iv: '', algorithm: ALGORITHM };
        
        // Ensure key is 32 bytes (256 bits)
        // If the hex key is provided, convert it, otherwise pad/slice the string
        let key = Buffer.from(ENCRYPTION_KEY, 'hex');
        if (key.length !== 32) {
            // Fallback for non-hex keys: take first 32 chars
            key = Buffer.alloc(32, ENCRYPTION_KEY, 'utf8');
        }

        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            encryptedMessage: encrypted,
            iv: iv.toString('hex'),
            algorithm: ALGORITHM
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt message');
    }
};

/**
 * Decrypts encrypted text using AES-256-CBC
 * @param {string} encryptedText - The hex-encoded encrypted message
 * @param {string} ivHex - The hex-encoded initialization vector
 * @returns {string} - The decrypted plain text
 */
const decryptMessage = (encryptedText, ivHex) => {
    try {
        if (!encryptedText || !ivHex) return '';

        let key = Buffer.from(ENCRYPTION_KEY, 'hex');
        if (key.length !== 32) {
            key = Buffer.alloc(32, ENCRYPTION_KEY, 'utf8');
        }

        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        // If decryption fails (e.g. wrong key or corrupted data), 
        // return a placeholder or original text if it was not encrypted
        return '[System: Message could not be decrypted]';
    }
};

module.exports = {
    encryptMessage,
    decryptMessage
};
