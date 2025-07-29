
'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { DemoRequestEmail } from '@/emails/demo-request';

const resend = new Resend(process.env.RESEND_API_KEY);

const demoRequestSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  message: z.string().optional(),
});

export async function sendDemoRequestEmail(prevState: any, formData: FormData) {
    const validatedFields = demoRequestSchema.safeParse({
        name: formData.get('name'),
        company: formData.get('company'),
        email: formData.get('email'),
        message: formData.get('message'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Datos de formulario inválidos.',
        };
    }
    
    const { name, company, email, message } = validatedFields.data;

    try {
        await resend.emails.send({
            from: 'TalentOS Platform <onboarding@resend.dev>', // Must be a verified domain on Resend
            to: ['admin@example.com'], // CHANGE THIS to your admin email
            subject: `Nueva Solicitud de Demo de: ${company}`,
            reply_to: email,
            react: DemoRequestEmail({ name, company, email, message }),
        });
        
        return { success: true, message: 'Gracias por tu interés. Nos pondremos en contacto contigo pronto.' };
    } catch (error) {
        console.error("Failed to send demo request email:", error);
        return { success: false, message: 'No se pudo enviar la solicitud. Por favor, inténtalo más tarde.' };
    }
}
