
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function saveApiKeyAction(prevState: any, formData: FormData) {
  const apiKey = formData.get('apiKey') as string;

  if (!apiKey) {
    cookies().delete('genai_api_key');
    revalidatePath('/dashboard/settings');
    return { success: true, message: 'API Key eliminada.' };
  }

  try {
    cookies().set('genai_api_key', apiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });
    revalidatePath('/dashboard/settings');
    return { success: true, message: 'API Key guardada correctamente.' };
  } catch (error) {
    console.error('Failed to save API key', error);
    return { success: false, message: 'Error al guardar la API Key.' };
  }
}
