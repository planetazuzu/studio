
'use server';

import { createClient } from '@supabase/supabase-js';
import type Dexie from 'dexie';

// This function will be called from a server action.
// It needs the Supabase URL and the SERVICE_ROLE_KEY to bypass RLS for server-side operations.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Iterates through a Dexie table, finds unsynced items, pushes them to Supabase,
 * and marks them as synced in Dexie.
 * @param dexieTable The Dexie table to process.
 * @param supabaseTable The name of the corresponding Supabase table.
 * @param transform A function to transform the Dexie item into the format expected by Supabase.
 */
async function syncTable<T extends { id?: number; isSynced?: boolean; dexieId?: string }, U>(
  dexieTable: Dexie.Table<T, any>,
  supabaseTable: string,
  transform: (item: T) => U
): Promise<{ upserted: number; errors: number }> {
  const unsyncedItems = await dexieTable.where('isSynced').equals('false').toArray();
  if (unsyncedItems.length === 0) return { upserted: 0, errors: 0 };

  const itemsToUpsert = unsyncedItems.map(transform);

  const { error } = await supabase.from(supabaseTable).upsert(itemsToUpsert, {
    onConflict: 'dexieId', // Assumes a 'dexieId' unique column exists in Supabase table
  });

  if (error) {
    console.error(`Supabase error syncing table ${supabaseTable}:`, error);
    return { upserted: 0, errors: unsyncedItems.length };
  }

  // Mark items as synced in Dexie
  const syncedIds = unsyncedItems.map(item => item.id!);
  await dexieTable.bulkUpdate(syncedIds.map(id => ({
    key: id,
    changes: { isSynced: true, updatedAt: new Date().toISOString() }
  })));

  return { upserted: unsyncedItems.length, errors: 0 };
}


export async function syncToSupabase(db: Dexie.Dexie & { [key: string]: Dexie.Table<any, any> }): Promise<{ success: boolean; message: string; }> {
    let totalUpserted = 0;
    let totalErrors = 0;

    const syncPlan = [
        {
            dexieTable: db.users,
            supabaseTable: 'Users',
            transform: (item: any) => ({ ...item, id: undefined, isSynced: undefined }) // Exclude Dexie-only fields
        },
        {
            dexieTable: db.courses,
            supabaseTable: 'Courses',
            transform: (item: any) => ({ ...item, id: undefined, isSynced: undefined })
        },
        {
            dexieTable: db.enrollments,
            supabaseTable: 'Enrollments',
            transform: (item: any) => ({ ...item, id: undefined, isSynced: undefined })
        },
        {
            dexieTable: db.userProgress,
            supabaseTable: 'UserProgress',
            transform: (item: any) => ({ ...item, id: undefined, isSynced: undefined })
        },
         {
            dexieTable: db.costs,
            supabaseTable: 'Costs',
            transform: (item: any) => ({ ...item, id: undefined, isSynced: undefined })
        },
        // Add other tables here following the same pattern
    ];

    try {
        for (const plan of syncPlan) {
            const { upserted, errors } = await syncTable(plan.dexieTable, plan.supabaseTable, plan.transform);
            totalUpserted += upserted;
            totalErrors += errors;
        }

        if (totalErrors > 0) {
             return { success: false, message: `Sincronización completada con ${totalErrors} errores.` };
        }
        
        return { success: true, message: `Sincronización completada. ${totalUpserted} registros actualizados en la nube.` };

    } catch (e: any) {
        console.error("Critical error during sync process:", e);
        return { success: false, message: `Error crítico: ${e.message}` };
    }
}
