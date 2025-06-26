
'use server';

/**
 * @fileOverview Generates personalized announcement email content.
 *
 * - generateAnnouncementEmail - A function that creates the subject and body for an announcement email.
 * - GenerateAnnouncementEmailInput - The input type for the generateAnnouncementEmail function.
 * - GenerateAnnouncementEmailOutput - The return type for the generateAnnouncementEmail function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getGenAIKey } from '@/lib/config';
import { z } from 'genkit';

const GenerateAnnouncementEmailInputSchema = z.object({
  recipientName: z.string().describe('The name of the person receiving the email.'),
  announcementTitle: z.string().describe('The title of the announcement.'),
  announcementContent: z.string().describe('The content of the announcement.'),
});
export type GenerateAnnouncementEmailInput = z.infer<typeof GenerateAnnouncementEmailInputSchema>;

const GenerateAnnouncementEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body content of the email, formatted for an email client.'),
});
export type GenerateAnnouncementEmailOutput = z.infer<typeof GenerateAnnouncementEmailOutputSchema>;

export async function generateAnnouncementEmail(
  input: GenerateAnnouncementEmailInput
): Promise<GenerateAnnouncementEmailOutput> {
  return generateAnnouncementEmailFlow(input);
}

const generateAnnouncementEmailFlow = ai.defineFlow(
  {
    name: 'generateAnnouncementEmailFlow',
    inputSchema: GenerateAnnouncementEmailInputSchema,
    outputSchema: GenerateAnnouncementEmailOutputSchema,
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
        schema: GenerateAnnouncementEmailOutputSchema,
      },
      prompt: `You are an AI assistant for a corporate training platform called AcademiaAI. Your task is to generate a professional email based on an internal announcement.

      Recipient Name: {{{recipientName}}}
      Announcement Title: {{{announcementTitle}}}
      Announcement Content: {{{announcementContent}}}

      Based on this, generate an appropriate subject and body for an email notification. Address the recipient by their name. Keep the tone friendly but professional.
      The body should be formatted nicely for an email.
      `,
    });
    return output!;
  }
);
