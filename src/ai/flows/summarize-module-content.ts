
'use server';

/**
 * @fileOverview An AI agent for summarizing module content.
 *
 * - summarizeModuleContent - A function that generates a summary for a piece of text.
 * - SummarizeModuleContentInput - The input type for the function.
 * - SummarizeModuleContentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getGenAIKey } from '@/lib/config';
import { z } from 'genkit';

export const SummarizeModuleContentInputSchema = z.string().describe('The content of the module to be summarized.');
export type SummarizeModuleContentInput = z.infer<typeof SummarizeModuleContentInputSchema>;

export const SummarizeModuleContentOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the module's content, highlighting key learning points."),
});
export type SummarizeModuleContentOutput = z.infer<typeof SummarizeModuleContentOutputSchema>;

export async function summarizeModuleContent(input: SummarizeModuleContentInput): Promise<SummarizeModuleContentOutput> {
  return summarizeModuleContentFlow(input);
}

const summarizeModuleContentFlow = ai.defineFlow(
  {
    name: 'summarizeModuleContentFlow',
    inputSchema: SummarizeModuleContentInputSchema,
    outputSchema: SummarizeModuleContentOutputSchema,
  },
  async (input) => {
    const apiKey = getGenAIKey();
    if (!apiKey) {
      throw new Error('GenAI API key not found.');
    }

    const llm = googleAI.model('gemini-1.5-flash-latest');
    const { output } = await ai.generate({
      model: llm,
      plugins: [googleAI({ apiKey })],
      input,
      output: {
        schema: SummarizeModuleContentOutputSchema,
      },
      prompt: `You are an expert AI assistant specializing in creating educational materials for emergency medical personnel.
      Your task is to summarize the following course module content. The summary should be concise, clear, and focus on the most critical learning objectives and key takeaways for a student.

      Keep the tone professional and direct.

      Module Content to Summarize:
      ---
      {{{input}}}
      ---
      `,
    });
    return output!;
  }
);
