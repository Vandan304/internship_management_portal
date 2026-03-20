const fs = require('fs');
const path = require('path');
const { uploadToS3, deleteFromS3 } = require('./s3Service');

/**
 * Robust Storage Service with S3 Fallback to Local Storage
 */
const storageService = {
    /**
     * Upload file with automatic fallback
     * @param {Buffer} fileBuffer 
     * @param {string} fileName 
     * @param {string} mimetype 
     * @param {string} folder - e.g. 'certificates'
     * @returns {Promise<{fileUrl: string, storageType: 's3' | 'local'}>}
     */
    uploadFile: async (fileBuffer, fileName, mimetype, folder = 'certificates') => {
        try {
            console.log(`[STORAGE] Attempting S3 upload: ${fileName}`);
            const s3Key = `uploads/${folder}/${fileName}`;
            const fileUrl = await uploadToS3(fileBuffer, s3Key, mimetype);
            
            return {
                fileUrl,
                storageType: 's3'
            };
        } catch (error) {
            console.error(`[STORAGE FALLBACK] S3 Upload failed, switching to local:`, error.message);
            
            // Local fallback logic
            const localDir = path.join(__dirname, '..', 'uploads', folder);
            if (!fs.existsSync(localDir)) {
                fs.mkdirSync(localDir, { recursive: true });
            }

            const localPath = path.join(localDir, fileName);
            fs.writeFileSync(localPath, fileBuffer);

            // Return relative path for local storage
            const relativePath = `uploads/${folder}/${fileName}`;
            
            return {
                fileUrl: relativePath,
                storageType: 'local'
            };
        }
    },

    /**
     * Delete file from either S3 or Local
     * @param {string} fileUrl 
     * @param {string} storageType 
     */
    deleteFile: async (fileUrl, storageType) => {
        try {
            if (storageType === 's3' || (fileUrl && fileUrl.startsWith('http'))) {
                await deleteFromS3(fileUrl);
            } else {
                const localPath = path.join(__dirname, '..', fileUrl);
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                    console.log(`[STORAGE] Local file deleted: ${localPath}`);
                }
            }
        } catch (error) {
            console.error(`[STORAGE ERROR] Delete failed:`, error.message);
        }
    }
};

module.exports = storageService;
