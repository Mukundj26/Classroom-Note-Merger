'use server';
/**
 * @fileOverview This file implements the intelligent note merging flow.
 *
 * - intelligentNoteMerging - A function that handles the note merging process.
 * - IntelligentNoteMergingInput - The input type for the intelligentNoteMerging function.
 * - IntelligentNoteMergingOutput - The return type for the intelligentNoteMerging function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentNoteMergingInputSchema = z.object({
  notes: z.array(z.string()).describe('An array of notes to merge.'),
});
export type IntelligentNoteMergingInput = z.infer<
  typeof IntelligentNoteMergingInputSchema
>;

const IntelligentNoteMergingOutputSchema = z.object({
  mergedNotes: z.string().describe('The merged and cleaned notes.'),
});
export type IntelligentNoteMergingOutput = z.infer<
  typeof IntelligentNoteMergingOutputSchema
>;

export async function intelligentNoteMerging(
  input: IntelligentNoteMergingInput
): Promise<IntelligentNoteMergingOutput> {
  return intelligentNoteMergingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentNoteMergingPrompt',
  input: {schema: IntelligentNoteMergingInputSchema},
  output: {schema: IntelligentNoteMergingOutputSchema},
  prompt: `You are a helpful assistant that merges notes from multiple students into a single, comprehensive set of notes. Remove any duplicate information and organize the notes in a logical order.

Notes:
{{#each notes}}{{{this}}}
{{/each}}`,
});

const intelligentNoteMergingFlow = ai.defineFlow(
  {
    name: 'intelligentNoteMergingFlow',
    inputSchema: IntelligentNoteMergingInputSchema,
    outputSchema: IntelligentNoteMergingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
