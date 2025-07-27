'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase-client';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function handlePasswordRequest(prevState: any, formData: FormData) {
  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'La dirección de correo electrónico no es válida.',
    };
  }

  const { email } = validatedFields.data;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')}/password-reset`,
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña.',
    };
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: error.message || 'No se pudo procesar la solicitud. Por favor, inténtalo de nuevo.',
    };
  }
}