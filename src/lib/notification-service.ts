'use server';

/**
 * @fileOverview A service for handling external notifications.
 * This module simulates sending emails and WhatsApp messages.
 * In a production environment, you would replace the console.log statements
 * with actual API calls to services like SendGrid, Twilio, etc.
 */
import type { User } from './types';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmailNotification(user: User, subject: string, body: string): Promise<void> {
  const emailOptions: EmailOptions = {
    to: user.email,
    subject: subject,
    body: body,
  };
  
  console.log('--- [EMAIL SIMULATION] ---');
  console.log(`Provider: SendGrid (or similar)`);
  console.log(`Recipient: ${emailOptions.to}`);
  console.log(`Subject: ${emailOptions.subject}`);
  console.log(`Body: ${emailOptions.body}`);
  console.log('--------------------------');
  // In a real app, the API call would be here:
  // await sendgrid.send(emailOptions);
}

interface WhatsAppOptions {
  to: string; // E.164 format phone number
  message: string;
}

export async function sendWhatsAppNotification(user: User, message: string): Promise<void> {
   const whatsAppOptions: WhatsAppOptions = {
     to: '+1234567890', // Placeholder phone number
     message: `Hola ${user.name}, tienes una nueva notificación de EmergenciaAI: ${message}`,
   };

   console.log('--- [WHATSAPP SIMULATION] ---');
   console.log(`Provider: Twilio (or similar)`);
   console.log(`Recipient: ${whatsAppOptions.to} (User: ${user.name})`);
   console.log(`Message: ${whatsAppOptions.message}`);
   console.log('-----------------------------');
   // In a real app, the API call would be here:
   // await twilio.messages.create(whatsAppOptions);
}
