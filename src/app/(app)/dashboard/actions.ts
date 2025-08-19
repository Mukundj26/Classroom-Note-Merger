'use server';

import { z } from 'zod';
import { handwritingRecognition } from '@/ai/flows/handwriting-recognition';
import { intelligentNoteMerging } from '@/ai/flows/intelligent-note-merging';
import { pdfTextExtraction } from '@/ai/flows/pdf-text-extraction';

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
  data?: string;
};

export async function mergeNotesAction(
  prevState: State,
  formData: FormData
): Promise<State> {
  const notesJSON = formData.get('notes') as string;
  if (!notesJSON) {
    return { success: false, message: 'No notes provided.' };
  }

  try {
    const notes = mergeNotesSchema.parse(JSON.parse(notesJSON));

    if (notes.length === 0) {
      return { success: false, message: 'Please add at least one note to merge.' };
    }
    
    if (notes.length === 1) {
      return { success: false, message: 'Please add more than one note to merge.' };
    }

    // Check for API Key before making any calls
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
        return { success: false, message: 'Gemini API key is missing. Please add it to your .env file.' };
    }

    const textNotes = await Promise.all(
      notes.map(async (note) => {
        if (note.type === 'typed') {
          return note.content;
        } else if (note.type === 'pdf') {
            try {
              const result = await pdfTextExtraction({
                pdfDataUri: note.content,
              });
              return result.extractedText;
            } catch (e) {
              console.error(`Failed to extract text from PDF for ${note.name}`, e);
              return `[Could not extract text from PDF: ${note.name}]`;
            }
        } else { // 'handwritten'
          try {
            const result = await handwritingRecognition({
              photoDataUri: note.content,
            });
            return result.recognizedText;
          } catch (e) {
            console.error(`Failed to recognize handwriting for ${note.name}`, e);
            // Return an empty string or some error indicator if one image fails
            return `[Could not recognize: ${note.name}]`;
          }
        }
      })
    );

    const nonEmptyNotes = textNotes.filter(n => n.trim() !== '');
    if (nonEmptyNotes.length < 2) {
      return { success: false, message: 'Not enough content to merge after processing. Please check your notes.' };
    }

    const result = await intelligentNoteMerging({ notes: textNotes });

    return { success: true, message: 'Notes merged successfully!', data: result.mergedNotes };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    if (errorMessage.includes('API key not valid')) {
        return { success: false, message: 'Your Gemini API key is not valid. Please check it in your .env file.' };
    }
    return { success: false, message: `Failed to merge notes: ${errorMessage}` };
  }
}
