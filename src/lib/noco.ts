
'use server';

import { getNocoDBConfig } from './config';
import type { User, Course } from './types';

// These are the specific IDs for your NocoDB project.
// In a more advanced setup, these might also come from configuration.
const tableIDs = {
  users: "mua13xx6lp41ne5",
  courses: "mgf0wk011tfbo06",
  enrollments: "mcep00xiwbghugn",
  userProgress: "mgckuvg7dsy2oql",
  announcements: "mqkl01pvu4gy0bz",
  calendarEvents: "md6p2feqtxoiff7",
  externalTrainings: "mgqztsswkhryk02",
  resources: "mj6q20380uq46ol",
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

// For simplicity, we'll just implement create. A full sync would need update (PATCH) and delete.
// NocoDB uses the primary key from the body to create a record with a specific ID.
async function createRecord<T extends { id?: string | number }>(tableId: string, record: T): Promise<T> {
  // We remove fields that are local to the app and shouldn't be synced up.
  const { isSynced, updatedAt, ...restOfRecord } = record as any;
  
  // Explicitly remove password if it exists to avoid sending sensitive data
  const payload = { ...restOfRecord };
  if ('password' in payload) {
    delete (payload as any).password;
  }

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
// A "use server" file can only export async functions.

export async function createNocoUser(user: User): Promise<User> {
    return createRecord(tableIDs.users, user);
}

export async function createNocoCourse(course: Course): Promise<Course> {
    return createRecord(tableIDs.courses, course);
}
