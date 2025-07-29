
'use server';

import { cookies } from 'next/headers';
import type { User } from './types';
import * as db from './db';
import { Resend } from 'resend';
import twilio from 'twilio';
import { GoogleAuth } from 'google-auth-library';
import * as React from 'react';

function getConfigValue(cookieName: string, envVarName: string): string | undefined {
    return cookies().get(cookieName)?.value || process.env[envVarName];
}

async function getFirebaseCredentials(): Promise<{ projectId?: string; clientEmail?: string; privateKey?: string; }> {
    const cookieStore = cookies();
    return {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: cookieStore.get('firebase_client_email')?.value || process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: cookieStore.get('firebase_private_key')?.value || process.env.FIREBASE_PRIVATE_KEY,
    };
}

/**
 * Sends an email using Resend.
 * @param options - Email options.
 * @param options.to - Optional recipient email.
 * @param options.subject - The email subject.
 * @param options.react - The React component for the email body.
 * @param options.replyTo - Optional email address to set as the reply-to header.
 */
export async function sendEmail({ to, subject, react, replyTo }: { to: string; subject: string; react: React.ReactElement; replyTo?: string }): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = 'onboarding@resend.dev';

    if (!apiKey) {
        console.warn(`--- [EMAIL SIMULATION] ---`);
        console.warn('Resend API Key not set. Simulating email send.');
        console.log(`To: ${to}`);
        console.log(`From: ${fromEmail}`);
        console.log(`Reply-To: ${replyTo || 'N/A'}`);
        console.log(`Subject: ${subject}`);
        console.log('---------------------------');
        await db.logSystemEvent('WARN', 'Email Simulation: Resend API Key not set.');
        return;
    }

    const resend = new Resend(apiKey);

    try {
        await resend.emails.send({
            from: fromEmail,
            to: to,
            subject: subject,
            react: react,
            reply_to: replyTo,
        });
        await db.logSystemEvent('INFO', `Email sent successfully to ${to}`, { subject });
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        await db.logSystemEvent('ERROR', `Failed to send email to ${to}`, { error: (error as Error).message });
        throw error;
    }
}


// --- Email Service ---
export async function sendEmailNotification(user: User, subject: string, body: string): Promise<void> {
   await sendEmail({ 
        to: user.email, 
        subject, 
        react: <div><p>{body.replace(/\n/g, '<br />')}</p></div>
    });
}

// --- WhatsApp Service (Twilio) ---
export async function sendWhatsAppNotification(user: User, message: string): Promise<void> {
    const accountSid = getConfigValue('twilio_account_sid', 'TWILIO_ACCOUNT_SID');
    const authToken = getConfigValue('twilio_auth_token', 'TWILIO_AUTH_TOKEN');
    const fromPhone = getConfigValue('twilio_whatsapp_from', 'TWILIO_WHATSAPP_FROM');
    const toPhone = user.phone;

    if (!accountSid || !authToken || !fromPhone || !toPhone) {
        console.warn(`--- [WHATSAPP SIMULATION to ${toPhone || 'N/A'}] ---`);
        console.warn('Twilio credentials, From Phone, or User Phone not set. Simulating WhatsApp send.');
        console.log(`Message: ${message}`);
        console.log('------------------------------------');
        await db.logSystemEvent('WARN', `WhatsApp Simulation: Twilio credentials not fully set for user ${user.id}`);
        return;
    }

    const client = twilio(accountSid, authToken);

    try {
        await client.messages.create({
            from: `whatsapp:${fromPhone}`,
            to: `whatsapp:${toPhone}`,
            body: message,
        });
        await db.logSystemEvent('INFO', `WhatsApp message sent to ${user.name}`);
    } catch (error) {
        console.error('Error sending WhatsApp message via Twilio:', error);
        await db.logSystemEvent('ERROR', `Failed to send WhatsApp message to ${user.name}`, { error: (error as Error).message });
    }
}


// --- Firebase Cloud Messaging (FCM) Service ---

async function getFirebaseAccessToken() {
    const scopes = ['https://www.googleapis.com/auth/firebase.messaging'];
    const { clientEmail, privateKey } = await getFirebaseCredentials();
    
    if (!clientEmail || !privateKey) {
        throw new Error('Firebase server credentials (client email, private key) are not configured.');
    }

    const auth = new GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey.replace(/\\n/g, '\n'),
        },
        scopes,
    });
    return await auth.getAccessToken();
}

export async function sendPushNotification(userId: string, title: string, body: string, url: string): Promise<void> {
    const { projectId, clientEmail, privateKey } = await getFirebaseCredentials();

    if (!projectId || !clientEmail || !privateKey) {
        console.warn('--- [PUSH SIMULATION] ---');
        console.warn('Firebase server environment variables not set. Simulating push notification.');
        console.log(`To User ID: ${userId}`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);
        console.log(`URL: ${url}`);
        console.log('---------------------------');
        await db.logSystemEvent('WARN', `Push Notification Simulation: Firebase server credentials not set for user ${userId}`);
        return;
    }

    const user = await db.getUserById(userId);
    if (!user || !user.fcmToken) {
        console.log(`Skipping push for ${user?.name || userId} - no FCM token.`);
        return;
    }

    try {
        const accessToken = await getFirebaseAccessToken();
        const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        
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

       await db.logSystemEvent('INFO', `Push notification sent to ${user.name}`);

    } catch (error) {
        console.error('Error sending push notification via FCM:', error);
        await db.logSystemEvent('ERROR', `Failed to send push notification to ${user.name}`, { error: (error as Error).message });
    }
}
