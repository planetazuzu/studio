
'use server';

/**
 * @fileOverview Provides personalized course recommendations based on a user's comprehensive profile.
 *
 * - personalizedCourseRecommendations - A function that returns personalized course recommendations.
 * - PersonalizedCourseRecommendationsInput - The input type for the function.
 * - PersonalizedCourseRecommendationsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getGenAIKey } from '@/lib/config';
import { z } from 'genkit';

export const PersonalizedCourseRecommendationsInputSchema = z.object({
  userRole: z.string().describe("The user's current role in the organization (e.g., 'Técnico de Emergencias', 'Jefe de Formación')."),
  enrolledCourseTitles: z.array(z.string()).describe('A list of titles of internal courses the user is already enrolled in or has completed.'),
  externalTrainingTitles: z.array(z.string()).describe('A list of titles of external courses or certifications the user has registered.'),
  allAvailableCourseTitles: z.array(z.string()).describe('The complete list of internal course titles available in the catalog for suggestion.'),
});
export type PersonalizedCourseRecommendationsInput = z.infer<typeof PersonalizedCourseRecommendationsInputSchema>;

const SuggestionSchema = z.object({
  courseTitle: z.string().describe('The title of the suggested course. Must be one of the titles from the `allAvailableCourseTitles` list.'),
  reason: z.string().describe('A brief, one-sentence explanation for why this course is being recommended to the user, in Spanish.'),
});

export const PersonalizedCourseRecommendationsOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).max(3).describe('An array of up to 3 course recommendations.'),
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
      prompt: `You are an expert career advisor for an emergency services training platform. Your task is to recommend relevant internal courses to a user based on their profile.

      Analyze the user's data:
      - Role: {{{userRole}}}
      - Internal Courses Already Taken: {{#if enrolledCourseTitles}} "{{#each enrolledCourseTitles}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}" {{else}}None{{/if}}
      - External Training Completed: {{#if externalTrainingTitles}} "{{#each externalTrainingTitles}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}" {{else}}None{{/if}}

      Here is the complete catalog of available internal courses:
      {{#each allAvailableCourseTitles}}
      - "{{this}}"
      {{/each}}

      Based on all this information, suggest up to 3 courses from the catalog that would be most beneficial for the user.
      - Do NOT suggest courses the user is already enrolled in.
      - Prioritize suggestions that complement or build upon their existing external training (e.g., if they have an external 'cardiology' course, suggest an internal 'Advanced EKG' course).
      - If there are no clear links, suggest courses that are highly relevant to their role.
      - For each suggestion, provide a short, encouraging reason in Spanish.

      Return the suggestions in the specified JSON format.`,
    });
    return output!;
  }
);
