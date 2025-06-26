'use server';

// src/lib/noco.ts
import { getNocoDBConfig } from './config'

// These are the specific IDs for your NocoDB project.
// In a more advanced setup, these might also come from configuration.
const tableIDs = {
  users: 'moy9nk38t83b9sv',
  courses: 'mk12d8jh3jf8eis',
  enrollments: 'mibmex70eq1kopg',
  userProgress: 'msal7b37a28ihxv',
}

const getHeaders = () => {
  const config = getNocoDBConfig()
  if (!config) {
    throw new Error('La configuración de NocoDB (token) no se ha encontrado.');
  }
  return {
    'Content-Type': 'application/json',
    'xc-token': config.authToken,
  }
}

const getUrl = (tableId: string) => {
    const config = getNocoDBConfig();
    if (!config) {
        throw new Error('La configuración de NocoDB (URL de API) no se ha encontrado.');
    }
    // The API URL from settings should be the base, e.g., 'https://app.nocodb.com/api/v2'
    return `${config.apiUrl}/tables/${tableId}/records`;
}

// --- Funciones públicas ---

export async function getAllUsers() {
  const res = await fetch(getUrl(tableIDs.users), { headers: getHeaders() })
  if (!res.ok) throw new Error(`Error al obtener usuarios de NocoDB: ${res.statusText}`)
  const data = await res.json()
  return data.list
}

export async function getAllCourses() {
  const res = await fetch(getUrl(tableIDs.courses), { headers: getHeaders() })
  if (!res.ok) throw new Error(`Error al obtener cursos de NocoDB: ${res.statusText}`)
  const data = await res.json()
  return data.list
}

export async function getAllEnrollments() {
  const res = await fetch(getUrl(tableIDs.enrollments), { headers: getHeaders() })
  if (!res.ok) throw new Error(`Error al obtener inscripciones de NocoDB: ${res.statusText}`)
  const data = await res.json()
  return data.list
}

export async function getAllProgress() {
  const res = await fetch(getUrl(tableIDs.userProgress), { headers: getHeaders() })
  if (!res.ok) throw new Error(`Error al obtener progreso de NocoDB: ${res.statusText}`)
  const data = await res.json()
  return data.list
}
