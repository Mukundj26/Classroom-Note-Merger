'use server';

/**
 * @fileOverview Converts handwritten notes from an image to digital text using OCR.
 *
 * - handwritingRecognition - A function that handles the handwriting recognition process.
 * - HandwritingRecognitionInput - The input type for the handwritingRecognition function.
 * - HandwritingRecognitionOutput - The return type for the handwritingRecognition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HandwritingRecognitionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of handwritten notes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type HandwritingRecognitionInput = z.infer<typeof HandwritingRecognitionInputSchema>;

const HandwritingRecognitionOutputSchema = z.object({
  recognizedText: z
    .string()
    .describe('The text recognized from the handwritten notes.'),
});
export type HandwritingRecognitionOutput = z.infer<typeof HandwritingRecognitionOutputSchema>;

export async function handwritingRecognition(
  input: HandwritingRecognitionInput
): Promise<HandwritingRecognitionOutput> {
  return handwritingRecognitionFlow(input);
}

const handwritingRecognitionPrompt = ai.definePrompt({
  name: 'handwritingRecognitionPrompt',
  input: {schema: HandwritingRecognitionInputSchema},
  output: {schema: HandwritingRecognitionOutputSchema},
  prompt: `You are an OCR (Optical Character Recognition) expert. You will take a photo of handwritten notes and convert it into digital text. Only output the converted text. Do not include any additional information or conversation.

Photo: {{media url=photoDataUri}}`,
});

const handwritingRecognitionFlow = ai.defineFlow(
  {
    name: 'handwritingRecognitionFlow',
    inputSchema: HandwritingRecognitionInputSchema,
    outputSchema: HandwritingRecognitionOutputSchema,
  },
  async input => {
    const {output} = await handwritingRecognitionPrompt(input);
    return output!;
  }
);
