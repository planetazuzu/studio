
'use server';

import { cookies } from 'next/headers';
import type { User } from './types';
import * as db from './db';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { GoogleAuth } from 'google-auth-library';

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
 * Sends an email using SendGrid. Can be used for user notifications or system emails like form submissions.
 * @param options - Email options.
 * @param options.to - Optional recipient email. If not provided, sends to the configured admin/from email.
 * @param options.subject - The email subject.
 * @param options.body - The email body content (can be HTML).
 * @param options.replyTo - Optional email address to set as the reply-to header.
 */
export async function sendEmail({ to, subject, body, replyTo }: { to?: string; subject: string; body: string; replyTo?: string }): Promise<void> {
    const apiKey = getConfigValue('sendgrid_api_key', 'SENDGRID_API_KEY');
    const fromEmail = getConfigValue('sendgrid_from_email', 'SENDGRID_FROM_EMAIL');

    if (!apiKey || !fromEmail) {
        console.warn(`--- [EMAIL SIMULATION] ---`);
        console.warn('SendGrid API Key or From Email not set. Simulating email send.');
        console.log(`To: ${to || fromEmail}`);
        console.log(`From: ${fromEmail}`);
        console.log(`Reply-To: ${replyTo || 'N/A'}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body}`);
        console.log('---------------------------');
        return;
    }

    sgMail.setApiKey(apiKey);
    const msg = {
        to: to || fromEmail, // If 'to' is not specified, sends to the admin email itself
        from: fromEmail,
        replyTo: replyTo,
        subject,
        html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent successfully to ${msg.to}`);
    } catch (error) {
        console.error('Error sending email via SendGrid:', error);
        throw error; // Re-throw to be handled by the calling action
    }
}


// --- Email Service (SendGrid) ---
export async function sendEmailNotification(user: User, subject: string, body: string): Promise<void> {
   await sendEmail({ to: user.email, subject, body });
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
        return;
    }

    const client = twilio(accountSid, authToken);

    try {
        await client.messages.create({
            from: `whatsapp:${fromPhone}`,
            to: `whatsapp:${toPhone}`,
            body: message,
        });
        console.log(`WhatsApp message sent successfully to ${toPhone}`);
    } catch (error) {
        console.error('Error sending WhatsApp message via Twilio:', error);
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

        console.log(`Push notification sent successfully to ${user.name}`);

    } catch (error) {
        console.error('Error sending push notification via FCM:', error);
    }
}
