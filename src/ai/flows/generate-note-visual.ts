'use server';

/**
 * @fileOverview Generates a visual for the notes.
 *
 * - generateNoteVisual - A function that handles the visual generation process.
 * - GenerateNoteVisualInput - The input type for the generateNoteVisual function.
 * - GenerateNoteVisualOutput - The return type for the generateNoteVisual function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNoteVisualInputSchema = z.object({
  notes: z.string().describe('The notes to generate a visual for.'),
});
export type GenerateNoteVisualInput = z.infer<
  typeof GenerateNoteVisualInputSchema
>;

const GenerateNoteVisualOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      'The generated image as a data URI that must include a MIME type and use Base64 encoding.'
    ),
});
export type GenerateNoteVisualOutput = z.infer<
  typeof GenerateNoteVisualOutputSchema
>;

export async function generateNoteVisual(
  input: GenerateNoteVisualInput
): Promise<GenerateNoteVisualOutput> {
  return generateNoteVisualFlow(input);
}

const generateNoteVisualFlow = ai.defineFlow(
  {
    name: 'generateNoteVisualFlow',
    inputSchema: GenerateNoteVisualInputSchema,
    outputSchema: GenerateNoteVisualOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a visually appealing and relevant header image for a document containing student notes. The image should be abstract and conceptual, representing themes of learning, collaboration, and knowledge synthesis. Do not include any text in the image. The notes are about: ${input.notes.substring(0, 200)}...`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {imageDataUri: media!.url!};
  }
);
