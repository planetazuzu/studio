'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getNocoDBConfig } from '@/lib/config';
import type { User, Course, AIConfig, AIModel } from '@/lib/types';
import { createNocoUser, createNocoCourse } from '@/lib/noco';
import { useAuth } from '@/contexts/auth';
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
      'nocodb_api_url', 'nocodb_auth_token',
      'sendgrid_api_key', 'sendgrid_from_email',
      'twilio_account_sid', 'twilio_auth_token', 'twilio_whatsapp_from', 'twilio_whatsapp_to_test',
    ];

    for (const field of fieldsToSet) {
        const value = formData.get(field) as string;
        if (value) {
            cookies().set(field, value, cookieOptions);
        } else {
            // No se elimina la cookie si el campo está vacío, 
            // para no borrar credenciales existentes si el usuario solo quiere actualizar una.
            // Para borrar, se debería implementar un botón específico o una lógica de campo vacío explícita.
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


export async function syncAllDataAction(data: {
  users: User[];
  courses: Course[];
}): Promise<{
  success: boolean;
  log: string[];
  syncedIds: { users: string[], courses: string[] };
  message: string;
}> {
    const log: string[] = [];
    const syncedIds: { users: string[], courses: string[] } = { users: [], courses: [] };
    
    log.push("Recibida solicitud de sincronización en el servidor.");

    try {
        const nocoConfig = getNocoDBConfig();
        if (!nocoConfig?.apiUrl || !nocoConfig?.authToken) {
            throw new Error("La configuración de NocoDB no es válida. Ve a Ajustes > APIs para configurarla.");
        }
        
        log.push("Configuración de NocoDB encontrada y válida.");

        const { users: unsyncedUsers, courses: unsyncedCourses } = data;

        if (unsyncedUsers.length === 0 && unsyncedCourses.length === 0) {
            log.push("¡Todo está al día! No hay datos nuevos para sincronizar desde el cliente.");
            return { success: true, log, syncedIds, message: 'No hay datos nuevos para sincronizar.' };
        }

        // --- Sync Users ---
        if (unsyncedUsers.length > 0) {
            log.push(`--- Sincronizando ${unsyncedUsers.length} usuarios ---`);
            for (const user of unsyncedUsers) {
                try {
                    log.push(`Enviando POST a NocoDB para el usuario: ${user.name} (${user.email})`);
                    await createNocoUser(user);
                    syncedIds.users.push(user.id);
                    log.push(`-> Éxito para ${user.name}. Será marcado como sincronizado en el cliente.`);
                } catch (error: any) {
                    log.push(`-> ERROR al sincronizar a ${user.name}: ${error.message}`);
                }
            }
        } else {
            log.push("No hay usuarios nuevos o modificados para sincronizar.");
        }
        
        // --- Sync Courses ---
        if (unsyncedCourses.length > 0) {
            log.push(`--- Sincronizando ${unsyncedCourses.length} cursos ---`);
            for (const course of unsyncedCourses) {
                try {
                    log.push(`Enviando POST a NocoDB para el curso: ${course.title}`);
                    await createNocoCourse(course);
                    syncedIds.courses.push(course.id);
                    log.push(`-> Éxito para ${course.title}. Será marcado como sincronizado en el cliente.`);
                } catch (error: any) {
                    log.push(`-> ERROR al sincronizar a ${course.title}: ${error.message}`);
                }
            }
        } else {
            log.push("No hay cursos nuevos o modificados para sincronizar.");
        }

        log.push("Proceso de sincronización finalizado.");
        return { success: true, log, syncedIds, message: 'Sincronización completada.' };

    } catch (e: any) {
        log.push(`ERROR FATAL: ${e.message}`);
        return { success: false, log, syncedIds, message: e.message };
    }
}

export async function saveFcmTokenAction(token: string) {
    const user = await db.getLoggedInUser();
    if (!user) {
        return { success: false, message: 'Usuario no autenticado.' };
    }
    try {
        await db.saveFcmToken(user.id, token);
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
            user.id,
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
