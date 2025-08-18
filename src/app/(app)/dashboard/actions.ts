'use server';

import { z } from 'zod';
import { handwritingRecognition } from '@/ai/flows/handwriting-recognition';
import { intelligentNoteMerging } from '@/ai/flows/intelligent-note-merging';

const noteSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['typed', 'handwritten']),
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

    const textNotes = await Promise.all(
      notes.map(async (note) => {
        if (note.type === 'typed') {
          return note.content;
        } else {
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
    return { success: false, message: `Failed to merge notes: ${errorMessage}` };
  }
}
