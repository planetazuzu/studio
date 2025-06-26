
'use server';

/**
 * @fileOverview An AI agent for predicting student abandonment risk.
 *
 * - predictAbandonment - A function that analyzes student data to predict their risk of abandoning their studies.
 * - PredictAbandonmentInput - The input type for the function.
 * - PredictAbandonmentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getGenAIKey } from '@/lib/config';
import { z } from 'genkit';

export const PredictAbandonmentInputSchema = z.object({
  userName: z.string().describe('The name of the student.'),
  lastLogin: z.string().describe('Time since the student last logged in (e.g., "hace 3 días", "hace 2 semanas").'),
  activeCoursesCount: z.number().describe('The number of courses the student is currently enrolled in.'),
  completedCoursesCount: z.number().describe('The number of courses the student has completed.'),
  averageProgress: z.number().describe('The average completion percentage across all active courses.'),
});
export type PredictAbandonmentInput = z.infer<typeof PredictAbandonmentInputSchema>;

export const PredictAbandonmentOutputSchema = z.object({
  riskLevel: z.enum(['Bajo', 'Medio', 'Alto']).describe('The predicted risk level of abandonment.'),
  justification: z.string().describe('A brief, 2-3 sentence justification for the predicted risk level, explaining the key factors.'),
});
export type PredictAbandonmentOutput = z.infer<typeof PredictAbandonmentOutputSchema>;

export async function predictAbandonment(input: PredictAbandonmentInput): Promise<PredictAbandonmentOutput> {
  return predictAbandonmentFlow(input);
}

const predictAbandonmentFlow = ai.defineFlow(
  {
    name: 'predictAbandonmentFlow',
    inputSchema: PredictAbandonmentInputSchema,
    outputSchema: PredictAbandonmentOutputSchema,
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
        schema: PredictAbandonmentOutputSchema,
      },
      prompt: `You are an expert student success advisor for a corporate training platform. Your task is to analyze student data and predict their risk of abandonment (Bajo, Medio, Alto).

      Analyze the following student data:
      - Student Name: {{{userName}}}
      - Last Login: {{{lastLogin}}}
      - Active Courses: {{activeCoursesCount}}
      - Completed Courses: {{completedCoursesCount}}
      - Average Progress in Active Courses: {{averageProgress}}%

      Based on this data, determine the risk level.
      - A long time since last login (e.g., > 2 weeks) increases risk.
      - Low average progress (< 40%) increases risk.
      - A high number of active courses with low progress increases risk.
      - A good number of completed courses can mitigate risk.

      Provide a brief justification for your prediction, highlighting the key indicators. Keep it concise and actionable for a training manager.
      `,
    });
    return output!;
  }
);
