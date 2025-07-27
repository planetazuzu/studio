
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { AIConfig, AIModel } from '@/lib/types';
import * as db from '@/lib/db';
import { sendPushNotification } from '@/lib/notification-service';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'strict' as const,
  maxAge: 31536000, // 1 year
};

export async function saveApiKeysAction(prevState: any, formData: FormData) {
  try {
    const fieldsToSet = [
      'sendgrid_api_key', 'sendgrid_from_email',
      'twilio_account_sid', 'twilio_auth_token', 'twilio_whatsapp_from', 'twilio_whatsapp_to_test',
      'firebase_client_email', 'firebase_private_key',
      'supabase_service_role_key',
    ];

    for (const field of fieldsToSet) {
        const value = formData.get(field) as string;
        if (value) {
            cookies().set(field, value, cookieOptions);
        }
    }
    
    revalidatePath('/dashboard/settings');
    return { success: true, message: 'La configuración de APIs ha sido guardada.' };
  } catch (error) {
    console.error('Failed to save API keys', error);
    return { success: false, message: 'Error al guardar la configuración de APIs.' };
  }
}

export async function saveAIConfigAction(prevState: any, formData: FormData) {
  try {
    if (formData.has('openai_api_key')) {
        const openaiApiKey = formData.get('openai_api_key') as string;
        if (openaiApiKey) {
            cookies().set('openai_api_key', openaiApiKey, cookieOptions);
        } else {
            cookies().delete('openai_api_key');
        }
    }

    if (formData.has('gemini_api_key')) {
        const geminiApiKey = formData.get('gemini_api_key') as string;
        if (geminiApiKey) {
            cookies().set('gemini_api_key', geminiApiKey, cookieOptions);
        } else {
            cookies().delete('gemini_api_key');
        }
    }
    
    if (formData.has('activeModel')) {
        const activeModel = formData.get('activeModel') as AIModel;
        if (activeModel) {
            cookies().set('ai_active_model', activeModel, cookieOptions);
        }
    }

    revalidatePath('/dashboard/settings');
    return { success: true, message: 'La configuración de IA ha sido actualizada.' };
  } catch (error) {
    console.error('Failed to save AI config', error);
    return { success: false, message: 'Error al guardar la configuración de IA.' };
  }
}

export async function saveFcmTokenAction(token: string) {
    const user = await db.getLoggedInUser();
    if (!user) {
        return { success: false, message: 'Usuario no autenticado.' };
    }
    try {
        await db.saveFcmToken(user.id!, token);
        return { success: true, message: 'Token guardado correctamente.' };
    } catch (error) {
        console.error('Failed to save FCM token', error);
        return { success: false, message: 'No se pudo guardar el token.' };
    }
}

export async function sendTestPushNotificationAction() {
    const user = await db.getLoggedInUser();
    if (!user || !user.fcmToken) {
        return { success: false, message: 'Usuario no autenticado o sin token.' };
    }
    try {
        await sendPushNotification(
            user.id!,
            'Notificación de Prueba',
            '¡La configuración funciona correctamente!',
            '/dashboard'
        );
        return { success: true, message: 'Notificación de prueba enviada.' };
    } catch (error) {
        console.error('Failed to send test push notification', error);
        return { success: false, message: 'No se pudo enviar la notificación.' };
    }
}

export async function runSyncAction() {
    console.log("Starting synchronization action...");
    try {
        const result = await db.syncWithSupabase();
        return result;
    } catch(e: any) {
        console.error("Sync failed in action:", e);
        return { success: false, message: e.message || "An unknown error occurred during sync." };
    }
}
