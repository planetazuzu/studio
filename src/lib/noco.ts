'use server';

import { getNocoDBConfig } from './config';
import type { User, Course } from './types';

// These are the specific IDs for your NocoDB project.
// In a more advanced setup, these might also come from configuration.
const tableIDs = {
  users: 'moy9nk38t83b9sv',
  courses: 'mk12d8jh3jf8eis',
  enrollments: 'mibmex70eq1kopg',
  userProgress: 'msal7b37a28ihxv',
};

const getHeaders = () => {
  const config = getNocoDBConfig();
  if (!config) {
    throw new Error('La configuración de NocoDB (token) no se ha encontrado.');
  }
  return {
    'Content-Type': 'application/json',
    'xc-token': config.authToken,
  };
};

const getUrl = (tableId: string) => {
    const config = getNocoDBConfig();
    if (!config) {
        throw new Error('La configuración de NocoDB (URL de API) no se ha encontrado.');
    }
    // The API URL from settings should be the base, e.g., 'https://app.nocodb.com/api/v2'
    return `${config.apiUrl}/tables/${tableId}/records`;
}

// --- Generic API functions ---

async function getRecords<T>(tableId: string): Promise<T[]> {
  const res = await fetch(getUrl(tableId), { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Error al obtener datos de NocoDB (${res.status}): ${res.statusText}`);
  const data = await res.json();
  return data.list;
}

// For simplicity, we'll just implement create. A full sync would need update (PATCH) and delete.
// NocoDB uses the primary key from the body to create a record with a specific ID.
async function createRecord<T extends { id: string }>(tableId: string, record: T): Promise<T> {
  // We remove fields that are local to the app and shouldn't be synced up.
  const { isSynced, updatedAt, ...payload } = record as any;

  // NocoDB doesn't like empty fields for relations, etc.
  const cleanedPayload = Object.entries(payload).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      // @ts-ignore
      acc[key] = value;
    }
    return acc;
  }, {});


  const res = await fetch(getUrl(tableId), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(cleanedPayload),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    console.error('NocoDB Error:', errorBody);
    throw new Error(`Error al crear registro en NocoDB (${res.status}): ${errorBody.msg || res.statusText}`);
  }
  return await res.json();
}


// --- Public functions ---

// We are creating a namespaced export for better organization
export const noco = {
  users: {
    getAll: () => getRecords<User>(tableIDs.users),
    create: (user: User) => createRecord(tableIDs.users, user),
  },
  courses: {
    getAll: () => getRecords<Course>(tableIDs.courses),
    create: (course: Course) => createRecord(tableIDs.courses, course),
  },
  // Add other tables as needed...
};
