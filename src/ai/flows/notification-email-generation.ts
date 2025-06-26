
'use server';

/**
 * @fileOverview Generates personalized notification email content.
 *
 * - generateNotificationEmail - A function that creates the subject and body for a notification email.
 * - GenerateNotificationEmailInput - The input type for the generateNotificationEmail function.
 * - GenerateNotificationEmailOutput - The return type for the generateNotificationEmail function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getGenAIKey } from '@/lib/config';
import { z } from 'genkit';

const GenerateNotificationEmailInputSchema = z.object({
  recipientName: z.string().describe('The name of the person receiving the email.'),
  courseName: z.string().describe('The name of the course the notification is about.'),
  notificationType: z.enum(['course_reminder', 'new_course_available', 'feedback_ready']).describe('The type of notification being sent.'),
});
export type GenerateNotificationEmailInput = z.infer<typeof GenerateNotificationEmailInputSchema>;

const GenerateNotificationEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body content of the email.'),
});
export type GenerateNotificationEmailOutput = z.infer<typeof GenerateNotificationEmailOutputSchema>;

export async function generateNotificationEmail(
  input: GenerateNotificationEmailInput
): Promise<GenerateNotificationEmailOutput> {
  return generateNotificationEmailFlow(input);
}

const generateNotificationEmailFlow = ai.defineFlow(
  {
    name: 'generateNotificationEmailFlow',
    inputSchema: GenerateNotificationEmailInputSchema,
    outputSchema: GenerateNotificationEmailOutputSchema,
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
        schema: GenerateNotificationEmailOutputSchema,
      },
      prompt: `You are an AI assistant for a corporate training platform called AcademiaAI. Your task is to generate a personalized and professional email notification.

      Recipient Name: {{{recipientName}}}
      Course Name: {{{courseName}}}
      Notification Type: {{{notificationType}}}

      Based on the notification type, generate an appropriate subject and body for the email. Address the recipient by their name. Keep the tone friendly but professional.

      - If the type is 'course_reminder', remind them to continue their progress.
      - If the type is 'new_course_available', announce the new course and encourage them to enroll.
      - If the type is 'feedback_ready', let them know their feedback on a recent test is available.
      `,
    });
    return output!;
  }
);
