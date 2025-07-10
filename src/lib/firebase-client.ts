
'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function initializeAppIfConfigured(): FirebaseApp | null {
  if (app) return app;

  const isFirebaseConfigured =
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId;

  if (isFirebaseConfigured) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return app;
  }

  console.warn("Firebase no está configurado. Las funciones dependientes de Firebase estarán deshabilitadas.");
  return null;
}

export const getFirebaseMessagingToken = async () => {
    const firebaseApp = initializeAppIfConfigured();
    if (!firebaseApp) {
        console.warn("No se puede obtener el token de mensajería porque Firebase no está configurado.");
        return null;
    }
    
    if (messaging) {
        // Use existing instance
    } else if (await isSupported()) {
        messaging = getMessaging(firebaseApp);
    } else {
        console.warn("Firebase Messaging no es compatible con este navegador.");
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

// Export app instance for other potential Firebase services, initializing it on first access.
export function getFirebaseApp(): FirebaseApp | null {
    return initializeAppIfConfigured();
}
