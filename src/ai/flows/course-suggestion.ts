
'use server';

/**
 * @fileOverview Provides personalized course recommendations based on user profile and learning history.
 *
 * - personalizedCourseRecommendations - A function that returns course recommendations for a user.
 * - PersonalizedCourseRecommendationsInput - The input type for the personalizedCourseRecommendations function.
 * - PersonalizedCourseRecommendationsOutput - The return type for the personalizedCourseRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getGenAIKey } from '@/lib/config';
import { z } from 'genkit';

const PersonalizedCourseRecommendationsInputSchema = z.object({
  userProfile: z.string().describe('The profile of the user, including their skills, interests, and learning goals.'),
  learningHistory: z.string().describe('The learning history of the user, including completed courses and evaluations.'),
});
export type PersonalizedCourseRecommendationsInput = z.infer<typeof PersonalizedCourseRecommendationsInputSchema>;

const PersonalizedCourseRecommendationsOutputSchema = z.object({
  courseRecommendations: z.array(z.string()).describe('An array of recommended course titles.'),
});
export type PersonalizedCourseRecommendationsOutput = z.infer<typeof PersonalizedCourseRecommendationsOutputSchema>;

export async function personalizedCourseRecommendations(
  input: PersonalizedCourseRecommendationsInput
): Promise<PersonalizedCourseRecommendationsOutput> {
  return personalizedCourseRecommendationsFlow(input);
}

const personalizedCourseRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedCourseRecommendationsFlow',
    inputSchema: PersonalizedCourseRecommendationsInputSchema,
    outputSchema: PersonalizedCourseRecommendationsOutputSchema,
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
        schema: PersonalizedCourseRecommendationsOutputSchema,
      },
      prompt: `You are an AI assistant that suggests courses to users based on their profile and learning history.

      User Profile: {{{userProfile}}}
      Learning History: {{{learningHistory}}}

      Based on this information, suggest relevant courses that would help the user enhance their skills. Only return an array of course titles.
      `,
    });
    return output!;
  }
);
