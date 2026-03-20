const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Initialize the S3 Client securely picking up credentials from process.env
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Upload a file memory buffer to AWS S3.
 *
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @param {string} mimetype 
 * @returns {Promise<string>} 
 */
const uploadToS3 = async (fileBuffer, fileName, mimetype) => {
    try {
        const bucketName = process.env.AWS_BUCKET_NAME;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: mimetype
        });

        await s3Client.send(command);

        // Construct the full S3 URL according to the AWS standard
        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
        console.error(`[AWS S3 ERROR] Failed to upload ${fileName}:`, error);
        throw error;
    }
};

/**
 * Extract the object Key from a full S3 URL and delete it from the bucket.
 *
 * @param {string} fileUrl - The full S3 URL of the file to delete (e.g., 'https://bucket.s3.region.amazonaws.com/uploads/.../file.ext')
 * @returns {Promise<boolean>} - True if successfully deleted (or not an S3 file)
 */
const deleteFromS3 = async (fileUrl) => {
    try {
        if (!fileUrl || !fileUrl.startsWith('http')) {
            console.log(`[AWS S3 SKIP] fileUrl is not an S3 URL: ${fileUrl}`);
            return true; // Assume success for non-S3 items to prevent crashing logic
        }

        const bucketName = process.env.AWS_BUCKET_NAME;
        // The URL format is: https://<bucketName>.s3.<region>.amazonaws.com/<prefix>/<filename>
        const bucketDomain = `${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
        
        if (!fileUrl.includes(bucketDomain)) {
            console.warn(`[AWS S3 SKIP] fileUrl doesn't match current bucket domain: ${fileUrl}`);
            return false;
        }

        // Extract the Key (everything after the domain)
        const fileKey = fileUrl.split(bucketDomain)[1];
        
        if (!fileKey) {
            console.warn(`[AWS S3 WARNING] Failed to extract valid S3 Key from URL: ${fileUrl}`);
            // Depending on architecture, you might still want to proceed safely
            return false;
        }

        console.log(`[AWS S3 DELETE] Attempting to delete object with Key: ${fileKey}`);

        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileKey
        });

        await s3Client.send(command);
        console.log(`[AWS S3 SUCCESS] Deleted object Key: ${fileKey}`);

        return true;
    } catch (error) {
        console.error(`[AWS S3 ERROR] Failed to delete ${fileUrl}:`, error.message);
        // We log the error but optionally don't throw, to prevent application crashes when a file is simply missing
        return false;
    }
};

module.exports = {
    s3Client,
    uploadToS3,
    deleteFromS3
};
