'use server';

/**
 * @fileOverview A flow to summarize a note for search purposes.
 *
 * - summarizeNoteForSearch - A function that takes a note and returns a short summary.
 * - SummarizeNoteForSearchInput - The input type for the summarizeNoteForSearch function.
 * - SummarizeNoteForSearchOutput - The return type for the summarizeNoteForSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNoteForSearchInputSchema = z.object({
  note: z.string().describe('The content of the note to summarize.'),
});
export type SummarizeNoteForSearchInput = z.infer<typeof SummarizeNoteForSearchInputSchema>;

const SummarizeNoteForSearchOutputSchema = z.object({
  summary: z.string().describe('A short summary of the note.'),
});
export type SummarizeNoteForSearchOutput = z.infer<typeof SummarizeNoteForSearchOutputSchema>;

export async function summarizeNoteForSearch(input: SummarizeNoteForSearchInput): Promise<SummarizeNoteForSearchOutput> {
  return summarizeNoteForSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeNoteForSearchPrompt',
  input: {schema: SummarizeNoteForSearchInputSchema},
  output: {schema: SummarizeNoteForSearchOutputSchema},
  prompt: `Summarize the following note in a single sentence for search purposes:\n\n{{{note}}}`,
});

const summarizeNoteForSearchFlow = ai.defineFlow(
  {
    name: 'summarizeNoteForSearchFlow',
    inputSchema: SummarizeNoteForSearchInputSchema,
    outputSchema: SummarizeNoteForSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
