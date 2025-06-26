
'use server';

/**
 * @fileOverview Provides personalized course recommendations based on user profile and learning history.
 *
 * - personalizedCourseRecommendations - A function that returns course recommendations for a user.
 * - PersonalizedCourseRecommendationsInput - The input type for the personalizedCourseRecommendations function.
 * - PersonalizedCourseRecommendationsOutput - The return type for the personalizedCourseRecommendations function.
 */

import { getAiInstance } from '@/ai/get-ai-instance';
import { cookies } from 'next/headers';
import { z } from 'genkit';

const apiKey = cookies().get('genai_api_key')?.value;
const ai = getAiInstance(apiKey);

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

const prompt = ai.definePrompt({
  name: 'personalizedCourseRecommendationsPrompt',
  input: {schema: PersonalizedCourseRecommendationsInputSchema},
  output: {schema: PersonalizedCourseRecommendationsOutputSchema},
  prompt: `You are an AI assistant that suggests courses to users based on their profile and learning history.

  User Profile: {{{userProfile}}}
  Learning History: {{{learningHistory}}}

  Based on this information, suggest relevant courses that would help the user enhance their skills. Only return an array of course titles.
  `,
});

const personalizedCourseRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedCourseRecommendationsFlow',
    inputSchema: PersonalizedCourseRecommendationsInputSchema,
    outputSchema: PersonalizedCourseRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
