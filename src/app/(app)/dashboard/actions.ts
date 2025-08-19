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

// Function to remove characters not supported by WinAnsiEncoding
function cleanTextForPdf(text: string): string {
  // This is a simplified approach. A more robust solution might involve
  // more complex regex or a library, but this covers many common cases.
  return text.replace(/[^\x00-\x7F]/g, ''); // Removes non-ASCII characters
}


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
    
    // Clean the text before adding to PDF
    const cleanedMergedNotes = cleanTextForPdf(mergedNotes);

    // Generate the visual
    const visualResult = await generateNoteVisual({notes: mergedNotes});
    const imageBase64 = visualResult.imageDataUri.split(',')[1];
    const imageBytes = Buffer.from(imageBase64, 'base64');

    // Create a new PDF
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontSize = 12;
    const lineHeight = 15;
    
    // Add first page
    let page = pdfDoc.addPage();
    let {width, height} = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Embed and draw image on the first page
    const image = await pdfDoc.embedPng(imageBytes);
    const imageDims = image.scale(0.25);
    
    // Draw the image at the top of the page
    page.drawImage(image, {
      x: (width - imageDims.width) / 2, // Center the image
      y: y - imageDims.height,
      width: imageDims.width,
      height: imageDims.height,
    });
    
    y -= imageDims.height + 70;

    // Logic to handle text wrapping and pagination, now including newlines
    const paragraphs = cleanedMergedNotes.split('\n');

    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = timesRomanFont.widthOfTextAtSize(testLine, fontSize);

        if (testWidth < width - 2 * margin) {
          currentLine = testLine;
        } else {
          // Draw the line
          page.drawText(currentLine, {
            x: margin,
            y,
            font: timesRomanFont,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;

          // Check if new page is needed
          if (y < margin) {
            page = pdfDoc.addPage();
            y = page.getSize().height - margin;
          }
          currentLine = word;
        }
      }

      // Draw the last line of the paragraph
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y,
          font: timesRomanFont,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
        if (y < margin) {
          page = pdfDoc.addPage();
          y = page.getSize().height - margin;
        }
      }
    }


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
