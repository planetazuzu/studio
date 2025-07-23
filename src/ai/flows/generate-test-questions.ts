
'use server';

/**
 * @fileOverview An AI agent for automatically generating tests and quizzes based on course content.
 *
 * - generateTestQuestions - A function that generates test questions based on the provided course content.
 */

import { ai } from '@/ai/genkit';
import { getActiveAIProvider } from '@/ai/provider';
import {
  GenerateTestQuestionsInput,
  GenerateTestQuestionsInputSchema,
  GenerateTestQuestionsOutput,
  GenerateTestQuestionsOutputSchema,
} from '@/lib/types';


export async function generateTestQuestions(input: GenerateTestQuestionsInput): Promise<GenerateTestQuestionsOutput> {
  return generateTestQuestionsFlow(input);
}


const prompt = ai.definePrompt({
    name: 'generateTestQuestionsPrompt',
    inputSchema: GenerateTestQuestionsInputSchema,
    outputSchema: GenerateTestQuestionsOutputSchema,
    prompt: `You are an expert medical educator specializing in creating tests and quizzes for emergency personnel (EMTs, dispatchers).

      You will use the provided course content to generate {{numberOfQuestions}} test questions of {{difficulty}} difficulty.

      Each question should have multiple choice options, and you should indicate the correct answer.

      Course Content: {{{courseContent}}}

      Output the questions in JSON format adhering to the schema.
      `,
}, async (input) => {
    const { llm, plugins } = await getActiveAIProvider();
    return {
        model: llm,
        plugins,
        output: { schema: GenerateTestQuestionsOutputSchema }
    }
});


const generateTestQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTestQuestionsFlow',
    inputSchema: GenerateTestQuestionsInputSchema,
    outputSchema: GenerateTestQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
