// src/ai/flows/generate-test-questions.ts
'use server';

/**
 * @fileOverview An AI agent for automatically generating tests and quizzes based on course content.
 *
 * - generateTestQuestions - A function that generates test questions based on the provided course content.
 * - GenerateTestQuestionsInput - The input type for the generateTestQuestions function.
 * - GenerateTestQuestionsOutput - The return type for the generateTestQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTestQuestionsInputSchema = z.object({
  courseContent: z
    .string()
    .describe('The content of the course for which to generate test questions.'),
  numberOfQuestions: z
    .number()
    .default(5)
    .describe('The number of test questions to generate.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium')
    .describe('The difficulty level of the test questions.'),
});
export type GenerateTestQuestionsInput = z.infer<typeof GenerateTestQuestionsInputSchema>;

const GenerateTestQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The test question.'),
      options: z.array(z.string()).describe('The possible answers for the question.'),
      correctAnswer: z.string().describe('The correct answer to the question.'),
    })
  ).
describe('The generated test questions.'),
});
export type GenerateTestQuestionsOutput = z.infer<typeof GenerateTestQuestionsOutputSchema>;

export async function generateTestQuestions(input: GenerateTestQuestionsInput): Promise<GenerateTestQuestionsOutput> {
  return generateTestQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTestQuestionsPrompt',
  input: {schema: GenerateTestQuestionsInputSchema},
  output: {schema: GenerateTestQuestionsOutputSchema},
  prompt: `You are an expert medical educator specializing in creating tests and quizzes for emergency personnel (EMTs, dispatchers).

You will use the provided course content to generate {{numberOfQuestions}} test questions of {{difficulty}} difficulty.

Each question should have multiple choice options, and you should indicate the correct answer.

Course Content: {{{courseContent}}}

Output the questions in JSON format adhering to the schema.
`,
});

const generateTestQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTestQuestionsFlow',
    inputSchema: GenerateTestQuestionsInputSchema,
    outputSchema: GenerateTestQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
