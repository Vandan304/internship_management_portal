const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// NOTE: The service account JSON should be placed in the config directory or referenced via environment variable
// For this implementation, we will look for a FIREBASE_SERVICE_ACCOUNT_PATH in .env
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

try {
    if (serviceAccountJSON) {
        // Option 1: Initialize using the JSON string from environment variable (Best for Vercel/Hosting)
        const serviceAccount = JSON.parse(serviceAccountJSON);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('[FIREBASE] Admin SDK initialized successfully via Environment Variable.');

    } else if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
        // Option 2: Initialize using the local JSON file path (Best for Local Development)
        const serviceAccount = require(path.resolve(serviceAccountPath));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('[FIREBASE] Admin SDK initialized successfully via local JSON file.');

    } else {
        console.warn('[FIREBASE WARNING] Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH found. Push notifications will be disabled.');
    }
} catch (error) {
    console.error('[FIREBASE ERROR] Failed to initialize Firebase Admin SDK:', error.message);
}

/**
 * @param {string} token - The recipient's FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} metadata - Optional metadata (userId, taskId, type) for logging
 */
const sendPushNotification = async (token, title, body, metadata = {}) => {
    const { userId, taskId, type } = metadata;
    const timestamp = new Date().toISOString();

    if (!admin.apps.length) {
        console.warn(`[FIREBASE] ${timestamp} - Push notification skipped (Not Initialized) - User: ${userId || 'N/A'}`);
        return null;
    }

    if (!token) {
        console.warn(`[FIREBASE] ${timestamp} - Push notification skipped (No Token) - User: ${userId || 'N/A'}`);
        return null;
    }

    const message = {
        notification: { title, body },
        data: {
            ...metadata,
            userId: String(userId || ''),
            taskId: String(taskId || ''),
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        token: token
    };

    console.log(`[FIREBASE] ${timestamp} - Attempting to send push:`, {
        userId,
        taskId,
        type,
        token: token.substring(0, 10) + '...'
    });

    try {
        const response = await admin.messaging().send(message);
        console.log(`[FIREBASE SUCCESS] ${timestamp} - Push sent:`, {
            response,
            userId,
            taskId
        });
        return response;
    } catch (error) {
        console.error(`[FIREBASE ERROR] ${timestamp} - Push failed:`, {
            error: error.message,
            userId,
            taskId
        });
        throw error;
    }
};

module.exports = { sendPushNotification };