
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
      prompt: `You are an expert AI tutor for a corporate training platform called AcademiaAI. Your role is to answer student questions based *only* on the provided course content. Be helpful, clear, and concise. If the answer is not in the content, state that you cannot answer the question with the provided information.

      Course Content:
      ---
      {{{courseContent}}}
      ---

      Here is the conversation history so far. Use it to understand the context of the user's new question.
      {{#each history}}
      {{this.role}}: {{{this.text}}}
      {{/each}}

      ---
      User's New Question:
      "{{{question}}}"

      Your Answer (based on the course content and conversation history):
      `,
    });
    return output!;
  }
);
