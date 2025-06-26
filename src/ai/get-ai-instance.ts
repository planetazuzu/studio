
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { Genkit } from 'genkit';

export function getAiInstance(apiKey?: string): Genkit {
  const finalApiKey = apiKey || process.env.GOOGLE_API_KEY;

  if (!finalApiKey) {
    // In a production app, you might want to handle this more gracefully.
    // For this educational context, throwing an error makes it clear what's missing.
    throw new Error(
      'GOOGLE_API_KEY not found. Please set it in your environment variables or configure it in the app settings.'
    );
  }

  return genkit({
    plugins: [googleAI({ apiKey: finalApiKey })],
    model: 'googleai/gemini-2.0-flash',
  });
}
