
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

/**
 * Retrieves the NocoDB configuration from server-side cookies.
 * @returns An object containing the NocoDB API URL and Auth Token, or null if either is missing.
 */
export function getNocoDBConfig(): { apiUrl: string; authToken: string } | null {
  const cookieStore = cookies();
  const apiUrl = cookieStore.get('nocodb_api_url')?.value;
  const authToken = cookieStore.get('nocodb_auth_token')?.value;

  if (apiUrl && authToken) {
    return { apiUrl, authToken };
  }
  
  return null;
}
