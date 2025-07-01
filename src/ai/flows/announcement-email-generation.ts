
'use server';

/**
 * @fileOverview Generates personalized announcement email content.
 *
 * - generateAnnouncementEmail - A function that creates the subject and body for an announcement email.
 */

import { ai } from '@/ai/genkit';
import { getActiveAIProvider } from '@/ai/provider';
import {
  GenerateAnnouncementEmailInput,
  GenerateAnnouncementEmailInputSchema,
  GenerateAnnouncementEmailOutput,
  GenerateAnnouncementEmailOutputSchema,
} from '@/lib/types';

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
    const { llm, plugins } = await getActiveAIProvider();
    
    const { output } = await ai.generate({
      model: llm,
      plugins: plugins,
      input: input,
      output: {
        schema: GenerateAnnouncementEmailOutputSchema,
      },
      prompt: `You are an AI assistant for a corporate training platform called TalentOS. Your task is to generate a professional email based on an internal announcement.

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
