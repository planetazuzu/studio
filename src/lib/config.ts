
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
 * Retrieves the NocoDB configuration from server-side cookies or environment variables.
 * Environment variables are prioritized for production deployments.
 * @returns An object containing the NocoDB API URL and Auth Token, or null if either is missing.
 */
export function getNocoDBConfig(): { apiUrl: string; authToken: string } | null {
  // Prioritize environment variables for production deployments
  const apiUrlFromEnv = process.env.NOCODB_API_URL;
  const authTokenFromEnv = process.env.NOCODB_AUTH_TOKEN;

  if (apiUrlFromEnv && authTokenFromEnv) {
    return { apiUrl: apiUrlFromEnv, authToken: authTokenFromEnv };
  }

  // Fallback to cookies for the in-app settings panel
  const cookieStore = cookies();
  const apiUrlFromCookie = cookieStore.get('nocodb_api_url')?.value;
  const authTokenFromCookie = cookieStore.get('nocodb_auth_token')?.value;

  if (apiUrlFromCookie && authTokenFromCookie) {
    return { apiUrl: apiUrlFromCookie, authToken: authTokenFromCookie };
  }
  
  return null;
}
