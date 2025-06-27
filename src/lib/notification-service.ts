
'use server';

/**
 * @fileOverview A service for handling external notifications.
 * This module connects to real email and WhatsApp services.
 */
import type { User } from './types';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

// --- Email Service (SendGrid) ---

export async function sendEmailNotification(user: User, subject: string, body: string): Promise<void> {
  const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = process.env;

  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    console.warn('--- [EMAIL SIMULATION] ---');
    console.warn('SendGrid environment variables not set. Simulating email send.');
    console.log(`To: ${user.email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('--------------------------');
    return;
  }

  sgMail.setApiKey(SENDGRID_API_KEY);

  const msg = {
    to: user.email,
    from: SENDGRID_FROM_EMAIL,
    subject: subject,
    html: body,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${user.email}`);
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    if ((error as any).response) {
      console.error((error as any).response.body);
    }
  }
}

// --- WhatsApp Service (Twilio) ---

export async function sendWhatsAppNotification(user: User, message: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;
  
  // A real implementation would require storing the user's phone number.
  // We'll use a placeholder for now.
  const userPhoneNumber = user.id === 'user_5' ? process.env.TWILIO_WHATSAPP_TO_TEST : null;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    console.warn('--- [WHATSAPP SIMULATION] ---');
    console.warn('Twilio environment variables not set. Simulating WhatsApp send.');
    console.log(`To User: ${user.name}`);
    console.log(`Message: ${message}`);
    console.log('-----------------------------');
    return;
  }
  
  if (!userPhoneNumber) {
    console.log(`Skipping WhatsApp for ${user.name} - no test phone number.`);
    return;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  try {
    await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${userPhoneNumber}`,
      body: `Hola ${user.name}, tienes una nueva notificación de EmergenciaAI: ${message}`,
    });
    console.log(`WhatsApp message sent successfully to ${user.name}`);
  } catch (error) {
    console.error('Error sending WhatsApp message with Twilio:', error);
  }
}
