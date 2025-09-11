'use server';

/**
 * @fileOverview A flow to summarize a note for search purposes.
 *
 * - summarizeNoteForSearch - A function that takes a note and returns a short summary.
 */

import {ai} from '@/ai/genkit';
import { SummarizeNoteForSearchInputSchema, SummarizeNoteForSearchOutputSchema, type SummarizeNoteForSearchInput, type SummarizeNoteForSearchOutput } from '@/types/schemas';


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
