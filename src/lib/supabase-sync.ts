
'use server';

import { createClient } from '@supabase/supabase-js';
import type { User, Course } from './types';

// This function should be secure and only called from server actions.
function getSupabaseAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Supabase URL or Service Role Key is not configured in environment variables.");
    }
    
    // Using the service role key bypasses RLS for server-side operations.
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    });
}

/**
 * Syncs unsynced local data up to the Supabase backend.
 * @param data An object containing arrays of unsynced users and courses.
 * @returns A result object with success status, logs, and synced item IDs.
 */
export async function syncWithSupabase(data: {
  users: User[];
  courses: Course[];
}): Promise<{
  success: boolean;
  log: string[];
  syncedUserIds: string[];
  syncedCourseIds: string[];
}> {
    const log: string[] = [];
    const syncedUserIds: string[] = [];
    const syncedCourseIds: string[] = [];

    try {
        const supabase = getSupabaseAdminClient();
        log.push("Supabase admin client initialized.");

        const { users: unsyncedUsers, courses: unsyncedCourses } = data;

        // --- Sync Users ---
        if (unsyncedUsers.length > 0) {
            log.push(`--- Sincronizando ${unsyncedUsers.length} usuarios ---`);
            const usersToUpsert = unsyncedUsers.map(({ password, isSynced, updatedAt, ...user }) => user);
            
            const { error: userError } = await supabase.from('Users').upsert(usersToUpsert, { onConflict: 'id' });
            
            if (userError) {
                log.push(`-> ERROR al sincronizar usuarios: ${userError.message}`);
            } else {
                unsyncedUsers.forEach(u => syncedUserIds.push(u.id));
                log.push(`-> Éxito. ${unsyncedUsers.length} usuarios sincronizados.`);
            }
        } else {
            log.push("No hay usuarios nuevos para sincronizar.");
        }
        
        // --- Sync Courses ---
        if (unsyncedCourses.length > 0) {
            log.push(`--- Sincronizando ${unsyncedCourses.length} cursos ---`);
            const coursesToUpsert = unsyncedCourses.map(({ isSynced, updatedAt, ...course }) => ({
                ...course,
                modules: JSON.stringify(course.modules || '[]'),
                mandatoryForRoles: JSON.stringify(course.mandatoryForRoles || '[]'),
            }));

            const { error: courseError } = await supabase.from('Courses').upsert(coursesToUpsert, { onConflict: 'id' });

            if (courseError) {
                log.push(`-> ERROR al sincronizar cursos: ${courseError.message}`);
            } else {
                unsyncedCourses.forEach(c => syncedCourseIds.push(c.id));
                log.push(`-> Éxito. ${unsyncedCourses.length} cursos sincronizados.`);
            }
        } else {
            log.push("No hay cursos nuevos para sincronizar.");
        }

        return { success: true, log, syncedUserIds, syncedCourseIds };

    } catch (e: any) {
        log.push(`ERROR FATAL: ${e.message}`);
        return { success: false, log, syncedUserIds, syncedCourseIds };
    }
}
