
'use server';

import { z } from 'zod';
import { sendEmail } from '@/lib/notification-service';

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
        const subject = `Nueva Solicitud de Demo de: ${company}`;
        const body = `
            Has recibido una nueva solicitud de demo a través de la web de TalentOS.
            <br><br>
            <strong>Nombre:</strong> ${name}<br>
            <strong>Empresa:</strong> ${company}<br>
            <strong>Email de Contacto:</strong> ${email}<br>
            <strong>Mensaje:</strong><br>
            <p>${message || 'No se proporcionó un mensaje adicional.'}</p>
        `;

        // This will send an email TO the admin email configured in SendGrid
        await sendEmail({
            subject,
            body,
            replyTo: email, // Set the user's email as the reply-to address
        });
        
        return { success: true, message: 'Gracias por tu interés. Nos pondremos en contacto contigo pronto.' };
    } catch (error) {
        console.error("Failed to send demo request email:", error);
        return { success: false, message: 'No se pudo enviar la solicitud. Por favor, inténtalo más tarde.' };
    }
}
