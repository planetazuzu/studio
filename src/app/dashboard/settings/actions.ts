'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getNocoDBConfig } from '@/lib/config';
import type { User, Course } from '@/lib/types';
import * as db from '@/lib/db';
import { noco } from '@/lib/noco';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'strict',
};

export async function saveApiKeysAction(prevState: any, formData: FormData) {
  const genaiApiKey = formData.get('genaiApiKey') as string;
  const nocodbApiUrl = formData.get('nocodbApiUrl') as string;
  const nocodbAuthToken = formData.get('nocodbAuthToken') as string;

  try {
    // Handle GenAI Key
    if (genaiApiKey) {
      cookies().set('genai_api_key', genaiApiKey, cookieOptions);
    } else {
      // If field is submitted empty, check if we should delete it
      if (formData.has('genaiApiKey')) {
         cookies().delete('genai_api_key');
      }
    }

    // Handle NocoDB URL
    if (nocodbApiUrl) {
      cookies().set('nocodb_api_url', nocodbApiUrl, cookieOptions);
    } else {
       if (formData.has('nocodbApiUrl')) {
        cookies().delete('nocodb_api_url');
      }
    }

    // Handle NocoDB Auth Token
    if (nocodbAuthToken) {
      cookies().set('nocodb_auth_token', nocodbAuthToken, cookieOptions);
    } else {
       if (formData.has('nocodbAuthToken')) {
        cookies().delete('nocodb_auth_token');
      }
    }

    revalidatePath('/dashboard/settings');
    return { success: true, message: 'La configuración de las APIs ha sido guardada.' };
  } catch (error) {
    console.error('Failed to save API keys', error);
    return { success: false, message: 'Error al guardar la configuración de las APIs.' };
  }
}


export async function syncAllDataAction(): Promise<{ success: boolean; log: string[], message: string }> {
    const log: string[] = [];
    
    log.push("Recibida solicitud de sincronización en el servidor.");

    try {
        const nocoConfig = getNocoDBConfig();
        if (!nocoConfig?.apiUrl || !nocoConfig?.authToken) {
            throw new Error("La configuración de NocoDB no es válida. Ve a Ajustes > APIs para configurarla.");
        }
        
        log.push("Configuración de NocoDB encontrada y válida.");

        const unsyncedUsers = await db.users.where('isSynced').equals(false).toArray();
        const unsyncedCourses = await db.courses.where('isSynced').equals(false).toArray();

        if (unsyncedUsers.length === 0 && unsyncedCourses.length === 0) {
            log.push("¡Todo está al día! No hay datos nuevos para sincronizar.");
            return { success: true, log, message: 'No hay datos nuevos para sincronizar.' };
        }

        // --- Sync Users ---
        if (unsyncedUsers.length > 0) {
            log.push(`--- Sincronizando ${unsyncedUsers.length} usuarios ---`);
            for (const user of unsyncedUsers) {
                try {
                    log.push(`Enviando POST a NocoDB para el usuario: ${user.name} (${user.email})`);
                    await noco.users.create(user);
                    // Mark as synced in local DB
                    await db.users.update(user.id, { isSynced: true });
                    log.push(`-> Éxito para ${user.name}. Marcado como sincronizado localmente.`);
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
                    await noco.courses.create(course);
                    // Mark as synced in local DB
                    await db.courses.update(course.id, { isSynced: true });
                    log.push(`-> Éxito para ${course.title}. Marcado como sincronizado localmente.`);
                } catch (error: any) {
                    log.push(`-> ERROR al sincronizar a ${course.title}: ${error.message}`);
                }
            }
        } else {
            log.push("No hay cursos nuevos o modificados para sincronizar.");
        }

        log.push("Proceso de sincronización finalizado.");
        return { success: true, log, message: 'Sincronización completada.' };

    } catch (e: any) {
        log.push(`ERROR FATAL: ${e.message}`);
        return { success: false, log, message: e.message };
    }
}
