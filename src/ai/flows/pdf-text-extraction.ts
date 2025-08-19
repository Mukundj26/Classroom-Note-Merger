'use server';

/**
 * @fileOverview Extracts text from a PDF document.
 *
 * - pdfTextExtraction - A function that handles the PDF text extraction process.
 * - PdfTextExtractionInput - The input type for the pdfTextExtraction function.
 * - PdfTextExtractionOutput - The return type for the pdfTextExtraction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PdfTextExtractionInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type (application/pdf) and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type PdfTextExtractionInput = z.infer<typeof PdfTextExtractionInputSchema>;

const PdfTextExtractionOutputSchema = z.object({
  extractedText: z
    .string()
    .describe('The text extracted from the PDF document.'),
});
export type PdfTextExtractionOutput = z.infer<typeof PdfTextExtractionOutputSchema>;

export async function pdfTextExtraction(
  input: PdfTextExtractionInput
): Promise<PdfTextExtractionOutput> {
  return pdfTextExtractionFlow(input);
}

const pdfTextExtractionPrompt = ai.definePrompt({
  name: 'pdfTextExtractionPrompt',
  input: {schema: PdfTextExtractionInputSchema},
  output: {schema: PdfTextExtractionOutputSchema},
  prompt: `You are an expert at extracting text from documents. You will take a PDF file and convert it into digital text. Only output the converted text. Do not include any additional information or conversation.

PDF: {{media url=pdfDataUri}}`,
});

const pdfTextExtractionFlow = ai.defineFlow(
  {
    name: 'pdfTextExtractionFlow',
    inputSchema: PdfTextExtractionInputSchema,
    outputSchema: PdfTextExtractionOutputSchema,
  },
  async input => {
    const {output} = await pdfTextExtractionPrompt(input);
    return output!;
  }
);
