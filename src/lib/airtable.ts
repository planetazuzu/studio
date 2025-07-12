
'use server';

import { getAirtableConfig } from './config';
import type { User, Course } from './types';

// Helper function to make requests to the Airtable API
async function makeAirtableRequest(url: string, method: string, body?: any) {
    const config = getAirtableConfig();
    if (!config?.apiKey) {
        throw new Error('La clave API de Airtable no está configurada.');
    }

    const headers = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error('Airtable API Error:', errorBody);
        throw new Error(`Error en la API de Airtable (${response.status}): ${errorBody.error?.message || response.statusText}`);
    }

    return response.json();
}

/**
 * Creates a record in a specified Airtable table.
 * @param table The name of the table.
 * @param fields The record fields to create.
 */
async function createRecord<T>(tableName: string, fields: T): Promise<any> {
    const config = getAirtableConfig();
    if (!config?.baseId) {
        throw new Error('El ID de la Base de Airtable no está configurado.');
    }

    const url = `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(tableName)}`;
    
    // We remove fields that are local to the app and shouldn't be synced up.
    const { isSynced, updatedAt, ...restOfRecord } = fields as any;
    
    const payload = { ...restOfRecord };
    if ('password' in payload) {
        delete (payload as any).password;
    }
    
    // Clean up fields that shouldn't exist in Airtable or are empty.
    const cleanedPayload = Object.entries(payload).reduce((acc, [key, value]) => {
        // List of fields to always ignore
        const ignoreFields = ['notificationSettings', 'fcmToken', 'points']; 
        if (ignoreFields.includes(key)) {
            return acc;
        }

        if (value !== null && value !== undefined) {
            // @ts-ignore
            acc[key] = value;
        }
        return acc;
    }, {});
    
    const body = {
        records: [{ fields: cleanedPayload }]
    };

    return makeAirtableRequest(url, 'POST', body);
}

// --- Public functions ---

export async function createAirtableUser(user: User): Promise<any> {
    // Only map the fields that exist in the Airtable Users table
    const fieldsToSync = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        department: user.department,
        // We are NOT syncing password, points, notificationSettings, etc.
    };
    return createRecord('Users', fieldsToSync);
}

export async function createAirtableCourse(course: Course): Promise<any> {
    // Stringify complex objects for Airtable long text fields
    const fieldsToSync = {
        ...course,
        modules: JSON.stringify(course.modules),
        mandatoryForRoles: JSON.stringify(course.mandatoryForRoles),
    };
    return createRecord('Courses', fieldsToSync);
}
