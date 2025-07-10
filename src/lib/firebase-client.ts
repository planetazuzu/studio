
'use client';

import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

// IMPORTANT: Replace this with your own Firebase configuration
// from your Firebase project settings.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required config values are present
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

// Initialize Firebase only if the configuration is complete
const app = isFirebaseConfigured && !getApps().length ? initializeApp(firebaseConfig) : (getApps().length > 0 ? getApp() : null);
const messaging = app && typeof window !== 'undefined' ? getMessaging(app) : undefined;


export const getFirebaseMessagingToken = async () => {
    if (!messaging) {
        console.warn("Firebase Messaging no está configurado. No se puede obtener el token.");
        return null;
    }
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });
            return token;
        } else {
            console.warn('Notification permission denied.');
            return null;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
        return null;
    }
};

export { app, messaging };
