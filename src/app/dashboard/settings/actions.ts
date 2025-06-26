
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getNocoDBConfig } from '@/lib/config';
import type { User, Course } from '@/lib/types';

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


export async function syncAllDataAction(data: { users: User[], courses: Course[] }): Promise<{ success: boolean; log: string[], message: string }> {
    const { users, courses } = data;
    const log: string[] = [];
    
    log.push("Recibida solicitud de sincronización en el servidor.");

    const nocoConfig = getNocoDBConfig();
    if (!nocoConfig) {
        log.push("ERROR: La configuración de NocoDB no se encontró en las cookies del servidor.");
        return { success: false, log, message: 'NocoDB no está configurado.' };
    }
    
    log.push("Configuración de NocoDB encontrada.");

    // --- Sync Users ---
    if (users.length > 0) {
        log.push(`--- Sincronizando ${users.length} usuarios ---`);
        for (const user of users) {
            try {
                // In a real implementation, you would check if the user exists in NocoDB first (e.g., using email as a key)
                // to decide whether to POST (create) or PATCH (update).
                // For this prototype, we'll just simulate a POST.
                
                log.push(`[SIMULACIÓN] Enviando POST a NocoDB para el usuario: ${user.name} (${user.email})`);
                
                // const response = await fetch(`${nocoConfig.apiUrl}/api/v2/tables/users/records`, {
                //     method: 'POST',
                //     headers: { 'xc-token': nocoConfig.authToken, 'Content-Type': 'application/json' },
                //     body: JSON.stringify(user)
                // });
                // if (!response.ok) throw new Error(`Failed to sync user ${user.id}`);
                
                log.push(`-> Éxito para ${user.name}.`);

            } catch (error: any) {
                 log.push(`-> ERROR al sincronizar a ${user.name}: ${error.message}`);
            }
        }
    } else {
        log.push("No hay usuarios para sincronizar.");
    }
    
    // --- Sync Courses ---
    if (courses.length > 0) {
        log.push(`--- Sincronizando ${courses.length} cursos ---`);
        for (const course of courses) {
             try {
                log.push(`[SIMULACIÓN] Enviando POST a NocoDB para el curso: ${course.title}`);
                log.push(`-> Éxito para ${course.title}.`);
            } catch (error: any) {
                 log.push(`-> ERROR al sincronizar a ${course.title}: ${error.message}`);
            }
        }
    } else {
        log.push("No hay cursos para sincronizar.");
    }

    log.push("Proceso de sincronización finalizado en el servidor.");
    return { success: true, log, message: 'Sincronización simulada con éxito.' };
}
