
'use server';

/**
 * @fileOverview An AI agent for summarizing module content.
 *
 * - summarizeModuleContent - A function that generates a summary for a piece of text.
 */

import { ai } from '@/ai/genkit';
import { getActiveAIProvider } from '@/ai/provider';
import {
  SummarizeModuleContentInput,
  SummarizeModuleContentInputSchema,
  SummarizeModuleContentOutput,
  SummarizeModuleContentOutputSchema,
} from '@/lib/types';


export async function summarizeModuleContent(input: SummarizeModuleContentInput): Promise<SummarizeModuleContentOutput> {
  return summarizeModuleContentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'summarizeModuleContentPrompt',
    inputSchema: SummarizeModuleContentInputSchema,
    outputSchema: SummarizeModuleContentOutputSchema,
    prompt: `You are an expert AI assistant specializing in creating educational materials for emergency medical personnel.
      Your task is to summarize the following course module content. The summary should be concise, clear, and focus on the most critical learning objectives and key takeaways for a student.

      Keep the tone professional and direct.

      Module Content to Summarize:
      ---
      {{{input}}}
      ---
      `,
}, async (input) => {
    const { llm, plugins } = await getActiveAIProvider();
    return {
        model: llm,
        plugins,
        output: { schema: SummarizeModuleContentOutputSchema }
    }
});

const summarizeModuleContentFlow = ai.defineFlow(
  {
    name: 'summarizeModuleContentFlow',
    inputSchema: SummarizeModuleContentInputSchema,
    outputSchema: SummarizeModuleContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
