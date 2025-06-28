
'use server';

import { cookies } from 'next/headers';
import { googleAI } from '@genkit-ai/googleai';
import { genkitPlugin, ModelReference } from 'genkit';
// In a real app, you would uncomment this when adding OpenAI support
// import { openAI } from '@genkit-ai/openai'; 

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
  const activeModel = cookieStore.get('ai_active_model')?.value || 'Gemini';
  
  let llm: ModelReference<any>;
  let plugins: genkitPlugin[] = [];
  let apiKey: string | undefined;

  switch (activeModel) {
    case 'OpenAI':
      apiKey = cookieStore.get('openai_api_key')?.value;
      if (!apiKey) throw new Error("La clave API para OpenAI no está configurada.");
      // Dummy implementation until openai plugin is added
      // llm = openAI.model('gpt-4-turbo');
      // plugins = [openAI({ apiKey })];
      // For now, we'll just throw an error if this is selected.
      throw new Error("El proveedor de OpenAI aún no está implementado.");

    case 'Claude':
    case 'HuggingFace':
    case 'Whisper':
       throw new Error(`El proveedor ${activeModel} aún no está implementado.`);

    case 'Gemini':
    default:
      apiKey = cookieStore.get('gemini_api_key')?.value;
      if (!apiKey) {
        throw new Error('La clave API para Gemini no está configurada. Por favor, configúrala en Ajustes > Inteligencia Artificial.');
      }
      llm = googleAI.model('gemini-1.5-flash-latest');
      plugins = [googleAI({ apiKey })];
      break;
  }
  
  return { llm, plugins };
}
