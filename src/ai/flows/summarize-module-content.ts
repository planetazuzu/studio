'use server';

/**
 * @fileOverview An AI agent for summarizing module content.
 *
 * - summarizeModuleContent - A function that generates a summary for a piece of text.
 * - SummarizeModuleContentInput - The input type for the function.
 * - SummarizeModuleContentOutput - The return type for the function.
 */

import { getAiInstance } from '@/ai/get-ai-instance';
import { cookies } from 'next/headers';
import { z } from 'genkit';

const apiKey = cookies().get('genai_api_key')?.value;
const ai = getAiInstance(apiKey);

export const SummarizeModuleContentInputSchema = z.string().describe('The content of the module to be summarized.');
export type SummarizeModuleContentInput = z.infer<typeof SummarizeModuleContentInputSchema>;

export const SummarizeModuleContentOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the module's content, highlighting key learning points."),
});
export type SummarizeModuleContentOutput = z.infer<typeof SummarizeModuleContentOutputSchema>;

export async function summarizeModuleContent(input: SummarizeModuleContentInput): Promise<SummarizeModuleContentOutput> {
  return summarizeModuleContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeModuleContentPrompt',
  input: {schema: SummarizeModuleContentInputSchema},
  output: {schema: SummarizeModuleContentOutputSchema},
  prompt: `You are an expert AI assistant specializing in creating educational materials for emergency medical personnel.
Your task is to summarize the following course module content. The summary should be concise, clear, and focus on the most critical learning objectives and key takeaways for a student.

Keep the tone professional and direct.

Module Content to Summarize:
---
{{{input}}}
---
`,
});

const summarizeModuleContentFlow = ai.defineFlow(
  {
    name: 'summarizeModuleContentFlow',
    inputSchema: SummarizeModuleContentInputSchema,
    outputSchema: SummarizeModuleContentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
