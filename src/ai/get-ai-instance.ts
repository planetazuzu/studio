
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { Genkit } from 'genkit';
import { getGenAIKey } from '@/lib/config';

export function getAiInstance(): Genkit {
  const apiKey = getGenAIKey();

  if (!apiKey) {
    // In a production app, you might want to handle this more gracefully.
    // For this educational context, throwing an error makes it clear what's missing.
    throw new Error(
      'GOOGLE_API_KEY not found. Please set it in your environment variables or configure it in the app settings.'
    );
  }

  return genkit({
    plugins: [googleAI({ apiKey })],
  });
}
