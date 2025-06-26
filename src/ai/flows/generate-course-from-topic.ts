
'use server';

/**
 * @fileOverview An AI agent for automatically generating a full course structure from a topic.
 *
 * - generateCourseFromTopic - A function that generates a course structure.
 * - GenerateCourseFromTopicInput - The input type for the function.
 * - GenerateCourseFromTopicOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getGenAIKey } from '@/lib/config';
import { z } from 'genkit';

export const GenerateCourseFromTopicInputSchema = z.string().describe('The topic for which to generate the course.');
export type GenerateCourseFromTopicInput = z.infer<typeof GenerateCourseFromTopicInputSchema>;

const ModuleSchema = z.object({
  title: z.string().describe('The title of the module.'),
  duration: z.string().describe('An estimated duration for the module, e.g., "2 horas".'),
  content: z.string().describe('A detailed summary of the content to be covered in this module.'),
});

export const GenerateCourseFromTopicOutputSchema = z.object({
  title: z.string().describe("A compelling and professional title for the course."),
  description: z.string().describe("A short, engaging description for the course card (1-2 sentences)."),
  longDescription: z.string().describe("A detailed description for the course page, outlining its objectives and what students will learn."),
  instructor: z.string().describe("A plausible Spanish name for a suitable instructor for this course."),
  duration: z.string().describe("The total estimated duration for the entire course, e.g., '16 horas'."),
  modality: z.enum(['Online', 'Presencial', 'Mixta']).describe("The most suitable modality for this course."),
  modules: z.array(ModuleSchema).min(3).max(7).describe("An array of 3 to 7 well-structured modules for the course."),
});
export type GenerateCourseFromTopicOutput = z.infer<typeof GenerateCourseFromTopicOutputSchema>;

export async function generateCourseFromTopic(input: GenerateCourseFromTopicInput): Promise<GenerateCourseFromTopicOutput> {
  return generateCourseFromTopicFlow(input);
}

const generateCourseFromTopicFlow = ai.defineFlow(
  {
    name: 'generateCourseFromTopicFlow',
    inputSchema: GenerateCourseFromTopicInputSchema,
    outputSchema: GenerateCourseFromTopicOutputSchema,
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
        schema: GenerateCourseFromTopicOutputSchema,
      },
      prompt: `You are an expert instructional designer for a corporate training platform specializing in emergency services (paramedics, dispatchers, etc.). Your task is to generate a complete, well-structured course outline based on a given topic. The target audience is Spanish-speaking emergency personnel.

      Topic: "{{{input}}}"

      Based on this topic, generate a full course structure. The content should be professional, practical, and tailored to the emergency services field in Spain.

      Provide the following information:
      - A professional and clear title.
      - A short, engaging description (1-2 sentences).
      - A longer, more detailed description explaining the course goals and content.
      - A plausible name for a qualified instructor (e.g., Dr., professional title).
      - The total estimated duration for the course (e.g., "16 horas").
      - The most appropriate modality (Online, Presencial, Mixta).
      - A list of 3 to 7 detailed modules. Each module must include a title, an estimated duration, and a summary of its content.

      Ensure the output is in Spanish and conforms strictly to the provided JSON schema.
      `,
    });
    return output!;
  }
);
