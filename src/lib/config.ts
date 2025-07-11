
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
 * Retrieves the Airtable configuration from server-side cookies or environment variables.
 * Environment variables are prioritized for production deployments.
 * @returns An object containing the Airtable API Key and Base ID, or null if either is missing.
 */
export function getAirtableConfig(): { apiKey: string; baseId: string; } | null {
  // Prioritize environment variables for production deployments
  const apiKeyFromEnv = process.env.AIRTABLE_API_KEY;
  const baseIdFromEnv = process.env.AIRTABLE_BASE_ID;

  if (apiKeyFromEnv && baseIdFromEnv) {
    return { apiKey: apiKeyFromEnv, baseId: baseIdFromEnv };
  }

  // Fallback to cookies for the in-app settings panel
  const cookieStore = cookies();
  const apiKeyFromCookie = cookieStore.get('airtable_api_key')?.value;
  const baseIdFromCookie = cookieStore.get('airtable_base_id')?.value;

  if (apiKeyFromCookie && baseIdFromCookie) {
    return { apiKey: apiKeyFromCookie, baseId: baseIdFromCookie };
  }
  
  return null;
}
