'use server';

import {z} from 'zod';
import {handwritingRecognition} from '@/ai/flows/handwriting-recognition';
import {intelligentNoteMerging} from '@/ai/flows/intelligent-note-merging';
import {pdfTextExtraction} from '@/ai/flows/pdf-text-extraction';
import {generateNoteVisual} from '@/ai/flows/generate-note-visual';
import {PDFDocument, rgb, StandardFonts} from 'pdf-lib';

const noteSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['typed', 'handwritten', 'pdf']),
  content: z.string(),
});

const mergeNotesSchema = z.array(noteSchema);

type State = {
  success: boolean;
  message: string;
  data?: string; // This will be the base64 encoded PDF
};

export async function mergeNotesAction(
  prevState: State,
  formData: FormData
): Promise<State> {
  const notesJSON = formData.get('notes') as string;
  if (!notesJSON) {
    return {success: false, message: 'No notes provided.'};
  }

  try {
    const notes = mergeNotesSchema.parse(JSON.parse(notesJSON));

    if (notes.length === 0) {
      return {
        success: false,
        message: 'Please add at least one note to merge.',
      };
    }

    if (notes.length === 1) {
      return {
        success: false,
        message: 'Please add more than one note to merge.',
      };
    }

    if (
      !process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY === 'YOUR_API_KEY_HERE'
    ) {
      return {
        success: false,
        message: 'Gemini API key is missing. Please add it to your .env file.',
      };
    }

    const textNotes = await Promise.all(
      notes.map(async note => {
        if (note.type === 'typed') {
          return note.content;
        } else if (note.type === 'pdf') {
          try {
            const result = await pdfTextExtraction({
              pdfDataUri: note.content,
            });
            return result.extractedText;
          } catch (e) {
            console.error(
              `Failed to extract text from PDF for ${note.name}`,
              e
            );
            return `[Could not extract text from PDF: ${note.name}]`;
          }
        } else {
          // 'handwritten'
          try {
            const result = await handwritingRecognition({
              photoDataUri: note.content,
            });
            return result.recognizedText;
          } catch (e) {
            console.error(
              `Failed to recognize handwriting for ${note.name}`,
              e
            );
            return `[Could not recognize: ${note.name}]`;
          }
        }
      })
    );

    const nonEmptyNotes = textNotes.filter(n => n.trim() !== '');
    if (nonEmptyNotes.length < 2) {
      return {
        success: false,
        message:
          'Not enough content to merge after processing. Please check your notes.',
      };
    }

    const mergeResult = await intelligentNoteMerging({notes: textNotes});
    const mergedNotes = mergeResult.mergedNotes;

    // Generate the visual
    const visualResult = await generateNoteVisual({notes: mergedNotes});
    const imageBase64 = visualResult.imageDataUri.split(',')[1];
    const imageBytes = Buffer.from(imageBase64, 'base64');

    // Create a new PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const {width, height} = page.getSize();

    const image = await pdfDoc.embedPng(imageBytes);
    const imageDims = image.scale(0.25); // Scale down the image

    // Draw the image at the top of the page
    page.drawImage(image, {
      x: (width - imageDims.width) / 2, // Center the image
      y: height - imageDims.height - 50,
      width: imageDims.width,
      height: imageDims.height,
    });
    
    // Add the text below the image
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(mergedNotes, {
      font: helveticaFont,
      size: 12,
      x: 50,
      y: height - imageDims.height - 120,
      maxWidth: width - 100,
      lineHeight: 15,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const pdfDataUri = `data:application/pdf;base64,${pdfBase64}`;

    return {
      success: true,
      message: 'PDF generated successfully!',
      data: pdfDataUri,
    };
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    if (errorMessage.includes('API key not valid')) {
      return {
        success: false,
        message:
          'Your Gemini API key is not valid. Please check it in your .env file.',
      };
    }
    return {success: false, message: `Failed to merge notes: ${errorMessage}`};
  }
}
