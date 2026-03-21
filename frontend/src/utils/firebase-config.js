import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyCl7CJgxXr0F_w3svJEoBzr7DigeEkwP-c",
    authDomain: "internshipmanagementproject.firebaseapp.com",
    projectId: "internshipmanagementproject",
    storageBucket: "internshipmanagementproject.firebasestorage.app",
    messagingSenderId: "212047231988",
    appId: "1:212047231988:web:374753afef6623ab2f17a1",
    measurementId: "G-TCN3CPX2W7"
};
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        // VAPID KEY CHECK to prevent console errors
        const vapidKey = "BJWoRSO_iwTt2P8-GtGvd-8fAvSUq29BTe5PtTA74JPIoHLfaF5HUsOzvovLLI1hQUoq-kw4b6k_vb6IybVlc70";
        if (!vapidKey || vapidKey === "BJWoRSO_iwTt2P8-GtGvd-8fAvSUq29BTe5PtTA74JPIoHLfaF5HUsOzvovLLI1hQUoq-kw4b6k_vb6IybVlc70") {
            console.warn("[FCM] VAPID Key is missing. Push notifications will be disabled.");
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const token = await getToken(messaging, { vapidKey });
            if (token) {
                console.log("FCM Token:", token);
                return token;
            }
        }
    } catch (error) {
        console.error("An error occurred while retrieving token.", error);
    }
    return null;
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });