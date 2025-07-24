
'use server';

import { cookies } from 'next/headers';
import { googleAI } from '@genkit-ai/googleai';
import { openAI } from 'genkitx-openai';
import { genkitPlugin, ModelReference } from 'genkit';
import type { AIModel } from '@/lib/types';
import * as db from '@/lib/db';

/**
 * Gets the active AI model and its corresponding Genkit plugin based on the
 * administrator's configuration, which is read from cookies.
 *
 * @returns An object containing the Genkit model reference and the configured plugin.
 * @throws An error if the active model's API key is not configured.
 */
export async function getActiveAIProvider(): Promise<{
  llm: ModelReference<any>;
  plugins: genkitPlugin[];
}> {
  const cookieStore = cookies();
  const config = await db.getAIConfig(); // This call is problematic on the server.
  const activeModel = config.activeModel;
  
  let llm: ModelReference<any>;
  let plugins: genkitPlugin[] = [];
  let apiKey: string | undefined;

  switch (activeModel) {
    case 'OpenAI':
      apiKey = cookieStore.get('openai_api_key')?.value;
      if (!apiKey) throw new Error("La clave API para OpenAI no está configurada.");
      llm = openAI.model('gpt-4-turbo');
      plugins = [openAI({ apiKey })];
      break;

    case 'Claude':
    case 'HuggingFace':
    case 'Whisper':
       throw new Error(`El proveedor ${activeModel} aún no está implementado.`);

    case 'Gemini':
    default:
      apiKey = cookieStore.get('gemini_api_key')?.value || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error('La clave API para Gemini no está configurada. Por favor, configúrala en Ajustes > Inteligencia Artificial.');
      }
      llm = googleAI.model('gemini-1.5-flash-latest');
      plugins = [googleAI({ apiKey })];
      break;
  }
  
  return { llm, plugins };
}
