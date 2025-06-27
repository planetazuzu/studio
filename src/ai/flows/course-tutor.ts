
'use server';

/**
 * @fileOverview An AI-powered course tutor.
 *
 * - courseTutor - A function that answers questions about a course.
 */

import { ai } from '@/ai/genkit';
import { getActiveAIProvider } from '@/ai/provider';
import {
  CourseTutorInput,
  CourseTutorInputSchema,
  CourseTutorOutput,
  CourseTutorOutputSchema,
} from '@/lib/types';

export async function courseTutor(input: CourseTutorInput): Promise<CourseTutorOutput> {
  return courseTutorFlow(input);
}

const courseTutorFlow = ai.defineFlow(
  {
    name: 'courseTutorFlow',
    inputSchema: CourseTutorInputSchema,
    outputSchema: CourseTutorOutputSchema,
  },
  async (input) => {
    const { llm, plugins } = await getActiveAIProvider();
    
    const { output } = await ai.generate({
      model: llm,
      plugins: plugins,
      input: input,
      output: {
        schema: CourseTutorOutputSchema,
      },
      prompt: `You are an expert AI tutor for a sanitary transport training platform. Your role is to answer student questions based *only* on the provided course content, which focuses on emergency medical procedures and protocols. Be helpful, clear, and concise. If the answer is not in the content, state that you cannot answer the question with the provided information.

      Course Content:
      ---
      {{{courseContent}}}
      ---

      User's Question:
      "{{{question}}}"

      Your Answer:
      `,
    });
    return output!;
  }
);
