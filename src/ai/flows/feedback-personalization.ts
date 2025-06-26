
'use server';

/**
 * @fileOverview A flow for generating personalized feedback on tests and assignments.
 *
 * - personalizedFeedback - A function that generates personalized feedback.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getGenAIKey } from '@/lib/config';
import {
  PersonalizedFeedbackInput,
  PersonalizedFeedbackInputSchema,
  PersonalizedFeedbackOutput,
  PersonalizedFeedbackOutputSchema,
} from '@/lib/types';

export async function personalizedFeedback(input: PersonalizedFeedbackInput): Promise<PersonalizedFeedbackOutput> {
  return personalizedFeedbackFlow(input);
}

const personalizedFeedbackFlow = ai.defineFlow(
  {
    name: 'personalizedFeedbackFlow',
    inputSchema: PersonalizedFeedbackInputSchema,
    outputSchema: PersonalizedFeedbackOutputSchema,
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
      input: input,
      output: {
        schema: PersonalizedFeedbackOutputSchema,
      },
      prompt: `You are an AI assistant providing personalized, encouraging feedback to students on their test results.

      Student Name: {{{studentName}}}
      Assignment Name: {{{assignmentName}}}
      Final Score: {{score}}%

      Here are the student's answers:
      {{#each questions}}
      - Question: "{{question}}"
        - Student's Answer: "{{studentAnswer}}"
        - Correct Answer: "{{correctAnswer}}"
      {{/each}}

      Based on their score and their specific answers, provide constructive and specific feedback to the student.
      - Start by congratulating them on their effort and mentioning their score.
      - If they did well, highlight a specific correct answer.
      - If they struggled, gently point out one area for improvement based on a specific incorrect answer. Do not be discouraging.
      - Keep the feedback concise and encouraging, around 3-4 sentences.
      - Address the student by name.`,
    });
    return output!;
  }
);
