'use server';

/**
 * @fileOverview An AI-powered course tutor.
 *
 * - courseTutor - A function that answers questions about a course.
 * - CourseTutorInput - The input type for the courseTutor function.
 * - CourseTutorOutput - The return type for the courseTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CourseTutorInputSchema = z.object({
    courseContent: z.string().describe('The full content of the course.'),
    question: z.string().describe('The user\'s question about the course.'),
});
export type CourseTutorInput = z.infer<typeof CourseTutorInputSchema>;

const CourseTutorOutputSchema = z.object({
    answer: z.string().describe('The AI tutor\'s answer to the question.'),
});
export type CourseTutorOutput = z.infer<typeof CourseTutorOutputSchema>;

export async function courseTutor(input: CourseTutorInput): Promise<CourseTutorOutput> {
    return courseTutorFlow(input);
}

const prompt = ai.definePrompt({
    name: 'courseTutorPrompt',
    input: {schema: CourseTutorInputSchema},
    output: {schema: CourseTutorOutputSchema},
    prompt: `You are an expert AI tutor for a sanitary transport training platform. Your role is to answer student questions based *only* on the provided course content, which focuses on emergency medical procedures and protocols. Be helpful, clear, and concise. If the answer is not in the content, state that you cannot answer the question with the provided information.

    Course Content:
    ---
    {{{courseContent}}}
    ---

    User's Question:
    "{{{question}}}"

    Your Answer:
    `,
});

const courseTutorFlow = ai.defineFlow(
    {
        name: 'courseTutorFlow',
        inputSchema: CourseTutorInputSchema,
        outputSchema: CourseTutorOutputSchema,
    },
    async input => {
        const {output} = await prompt(input);
        return output!;
    }
);
