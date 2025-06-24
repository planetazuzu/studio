// src/ai/flows/feedback-personalization.ts
'use server';

/**
 * @fileOverview A flow for generating personalized feedback on tests and assignments.
 *
 * - personalizedFeedback - A function that generates personalized feedback.
 * - PersonalizedFeedbackInput - The input type for the personalizedFeedback function.
 * - PersonalizedFeedbackOutput - The return type for the personalizedFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedFeedbackInputSchema = z.object({
  studentName: z.string().describe('The name of the student receiving feedback.'),
  assignmentName: z.string().describe('The name of the assignment or test.'),
  score: z.number().describe('The final score of the student as a percentage.'),
  questions: z
    .array(
      z.object({
        question: z.string(),
        studentAnswer: z.string(),
        correctAnswer: z.string(),
      })
    )
    .describe('The list of questions, student answers, and correct answers.'),
});
export type PersonalizedFeedbackInput = z.infer<typeof PersonalizedFeedbackInputSchema>;

const PersonalizedFeedbackOutputSchema = z.object({
  feedback: z.string().describe('Personalized feedback for the student.'),
});
export type PersonalizedFeedbackOutput = z.infer<typeof PersonalizedFeedbackOutputSchema>;

export async function personalizedFeedback(input: PersonalizedFeedbackInput): Promise<PersonalizedFeedbackOutput> {
  return personalizedFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedFeedbackPrompt',
  input: {schema: PersonalizedFeedbackInputSchema},
  output: {schema: PersonalizedFeedbackOutputSchema},
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

const personalizedFeedbackFlow = ai.defineFlow(
  {
    name: 'personalizedFeedbackFlow',
    inputSchema: PersonalizedFeedbackInputSchema,
    outputSchema: PersonalizedFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
