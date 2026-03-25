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
 * @param {object} data - Optional data payload
 */
const sendPushNotification = async (token, title, body, data = {}) => {
    if (!admin.apps.length) {
        console.warn('[FIREBASE] Push notification skipped: Admin SDK not initialized.');
        return null;
    }

    if (!token) {
        console.warn('[FIREBASE] Push notification skipped: No FCM token provided.');
        return null;
    }

    const message = {
        notification: {
            title,
            body
        },
        data: data,
        token: token
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('[FIREBASE] Push notification sent successfully:', response);
        return response;
    } catch (error) {
        console.error('[FIREBASE ERROR] Failed to send push notification:', error);
        throw error;
    }
};

module.exports = { sendPushNotification };