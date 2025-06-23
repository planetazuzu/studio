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
  studentAnswer: z.string().describe('The student\'s answer to the assignment.'),
  correctAnswer: z.string().describe('The correct answer to the assignment.'),
  teacherNotes: z.string().optional().describe('Optional notes from the teacher about the student or assignment.'),
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
  prompt: `You are an AI assistant providing personalized feedback to students on their assignments.

  Student Name: {{{studentName}}}
  Assignment Name: {{{assignmentName}}}

  Student Answer: {{{studentAnswer}}}
  Correct Answer: {{{correctAnswer}}}

  Teacher Notes: {{{teacherNotes}}}

  Provide constructive and specific feedback to the student, focusing on areas where they can improve. Be encouraging and supportive.  Point out specific things the student got right, and specific areas for improvement.  Address the student by name.
  The feedback should be no more than 3 sentences.`,
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
