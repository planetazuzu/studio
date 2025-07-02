
'use server';

import type { User } from './types';
import * as db from './db';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { GoogleAuth } from 'google-auth-library';

// --- Email Service (SendGrid) ---
export async function sendEmailNotification(user: User, subject: string, body: string): Promise<void> {
  // ... (existing implementation)
}

// --- WhatsApp Service (Twilio) ---
export async function sendWhatsAppNotification(user: User, message: string): Promise<void> {
  // ... (existing implementation)
}


// --- Firebase Cloud Messaging (FCM) Service ---

async function getFirebaseAccessToken() {
    const scopes = ['https://www.googleapis.com/auth/firebase.messaging'];
    const auth = new GoogleAuth({
        credentials: {
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes,
    });
    return await auth.getAccessToken();
}

export async function sendPushNotification(userId: string, title: string, body: string, url: string): Promise<void> {
    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        console.warn('--- [PUSH SIMULATION] ---');
        console.warn('Firebase server environment variables not set. Simulating push notification.');
        console.log(`To User ID: ${userId}`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);
        console.log(`URL: ${url}`);
        console.log('---------------------------');
        return;
    }

    const user = await db.getUserById(userId);
    if (!user || !user.fcmToken) {
        console.log(`Skipping push for ${user?.name || userId} - no FCM token.`);
        return;
    }

    try {
        const accessToken = await getFirebaseAccessToken();
        const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
        
        const message = {
            message: {
                token: user.fcmToken,
                notification: {
                    title,
                    body,
                },
                webpush: {
                    fcm_options: {
                        link: url,
                    },
                    notification: {
                        icon: '/icon-192x192.png',
                    }
                },
            },
        };

        const response = await fetch(fcmEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`FCM request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
        }

        console.log(`Push notification sent successfully to ${user.name}`);

    } catch (error) {
        console.error('Error sending push notification via FCM:', error);
    }
}
