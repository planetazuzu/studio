
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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
