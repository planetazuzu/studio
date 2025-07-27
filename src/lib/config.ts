
'use server';

import { cookies } from 'next/headers';

/**
 * Retrieves the GenAI API key from server-side cookies or environment variables.
 * Cookies take precedence.
 * @returns The API key string, or undefined if not found.
 */
export function getGenAIKey(): string | undefined {
  const cookieStore = cookies();
  const keyFromCookie = cookieStore.get('genai_api_key')?.value;
  return keyFromCookie || process.env.GOOGLE_API_KEY;
}
