
'use server';

import type Dexie from 'dexie';
import { getSupabaseClient } from './supabase-client';

/**
 * Iterates through a Dexie table, finds unsynced items, pushes them to Supabase,
 * and marks them as synced in Dexie.
 * @param supabase The Supabase client instance (with service_role key).
 * @param dexieTable The Dexie table to process.
 * @param supabaseTable The name of the corresponding Supabase table.
 * @param transform A function to transform the Dexie item into the format expected by Supabase.
 * @param idColumn The name of the unique ID column in the Supabase table (usually 'id').
 */
async function syncTable<T extends { id?: number | string; isSynced?: boolean }>(
  supabase: any,
  dexieTable: Dexie.Table<T, any>,
  supabaseTable: string,
  transform: (item: T) => object,
  idColumn: string = 'id'
): Promise<{ upserted: number; errors: number }> {
  const unsyncedItems = await dexieTable.where('isSynced').equals('false').toArray();
  if (unsyncedItems.length === 0) return { upserted: 0, errors: 0 };

  console.log(`Found ${unsyncedItems.length} items to sync for table ${supabaseTable}`);

  const itemsToUpsert = unsyncedItems.map(transform);

  const { error } = await supabase.from(supabaseTable).upsert(itemsToUpsert, {
    onConflict: idColumn,
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

    // Get the elevated-privilege Supabase client for server-side operations
    const supabase = getSupabaseClient();

    const syncPlan = [
        {
            dexieTable: db.users,
            supabaseTable: 'Users',
            transform: (item: any) => {
                const { isSynced, password, ...rest } = item;
                return rest;
            }
        },
        {
            dexieTable: db.courses,
            supabaseTable: 'Courses',
            transform: (item: any) => {
                 const { isSynced, scormPackage, ...rest } = item;
                 // Note: scormPackage is a Blob and cannot be directly serialized to JSON.
                 // If you need to sync SCORM packages, you would handle this differently,
                 // e.g., by uploading to Supabase Storage and storing the URL.
                 // For now, we simply exclude it.
                 return rest;
            }
        },
        {
            dexieTable: db.enrollments,
            supabaseTable: 'Enrollments',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            },
            idColumn: 'id' // Primary key in Supabase
        },
        {
            dexieTable: db.userProgress,
            supabaseTable: 'UserProgress',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            },
            idColumn: 'id'
        },
         {
            dexieTable: db.costs,
            supabaseTable: 'Costs',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            },
            idColumn: 'id'
        },
    ];

    try {
        for (const plan of syncPlan) {
            const { upserted, errors } = await syncTable(supabase, plan.dexieTable, plan.supabaseTable, plan.transform, plan.idColumn);
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
