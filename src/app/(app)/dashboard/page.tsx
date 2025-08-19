'use client';

import React, { useState, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { mergeNotesAction } from './actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Trash2,
  Loader2,
  Download,
  PlusCircle,
  Sparkles,
  ClipboardCopy,
  FileUp,
  FileImage,
  FileCheck2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type Note = {
  id: number;
  name: string;
  type: 'typed' | 'handwritten' | 'pdf';
  content: string; // content is raw text for 'typed', or base64 data URI for 'handwritten'/'pdf'
};

const initialState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Merge All Notes
    </Button>
  );
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [typedNote, setTypedNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [state, formAction] = useActionState(mergeNotesAction, initialState);

  React.useEffect(() => {
    if (state.message && !state.success) {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  const handleAddTypedNote = () => {
    if (typedNote.trim() === '') return;
    const newNote: Note = {
      id: Date.now(),
      name: `Typed Note ${notes.filter((n) => n.type === 'typed').length + 1}`,
      type: 'typed',
      content: typedNote,
    };
    setNotes([...notes, newNote]);
    setTypedNote('');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileToNote = (file: File): Promise<Note> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (!content) {
            return reject(new Error('Failed to read file.'));
          }
          const fileType = file.type.startsWith('image/') ? 'handwritten' : 'pdf';
          const newNote: Note = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: fileType,
            content,
          };
          resolve(newNote);
        };
        reader.onerror = (err) => {
          reject(err);
        };
        reader.readAsDataURL(file);
      });
    };

    try {
        const newNotes = await Promise.all(Array.from(files).map(fileToNote));
        setNotes(prevNotes => [...prevNotes, ...newNotes]);
    } catch (error) {
        toast({
            title: 'Error reading files',
            description: 'There was a problem processing your files. Please try again.',
            variant: 'destructive',
        });
        console.error(error);
    }


    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleRemoveNote = (id: number) => {
    setNotes(notes.filter((note) => note.id !== id));
  };
  
  const handleDownload = () => {
    if (!state.data) return;
    const a = document.createElement("a");
    a.href = state.data;
    a.download = "classsync-merged-notes.pdf";
    document.body.appendChild(a);
a.click();
    document.body.removeChild(a);
  };
  
  const handleCopy = () => {
    if (!state.data) return;
    // We can't copy the PDF, so we'll just show a toast.
    toast({
        title: 'Copy not available for PDF',
        description: 'You can download the PDF using the download button.',
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>1. Add Your Notes</CardTitle>
          <CardDescription>
            Add typed notes or upload PDF/image files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Paste or type your notes here."
                value={typedNote}
                onChange={(e) => setTypedNote(e.target.value)}
                rows={5}
              />
              <Button onClick={handleAddTypedNote} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Typed Note
              </Button>
            </div>
            <div>
              <Input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                id="file-upload"
                multiple
              />
               <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
                  <FileUp className="mr-2 h-4 w-4" /> Add File(s) (PDF/Image)
               </Button>
            </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
         <form action={formAction}>
           <input type="hidden" name="notes" value={JSON.stringify(notes)} />
            <CardHeader>
              <CardTitle>2. Review & Merge</CardTitle>
              <CardDescription>
                Review your added notes, then click merge. You need at least 2.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                    {notes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 rounded-lg border-dashed border-2 h-full">
                        <p>Your added notes will appear here.</p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div className="flex items-center gap-3 truncate">
                            {note.type === 'typed' && <FileText className="h-5 w-5 flex-shrink-0 text-primary" />}
                            {note.type === 'pdf' && <FileUp className="h-5 w-5 flex-shrink-0 text-primary" />}
                            {note.type === 'handwritten' && <FileImage className="h-5 w-5 flex-shrink-0 text-accent" />}
                            <span className="truncate text-sm font-medium">{note.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveNote(note.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                </div>
               </ScrollArea>
            </CardContent>
            <CardFooter>
               <SubmitButton />
            </CardFooter>
          </form>
      </Card>
      
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>3. Get Your Master Notes</CardTitle>
           <CardDescription>
            Your AI-powered merged notes will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border bg-muted p-4 min-h-[16rem] flex items-center justify-center">
                {state.success && state.data ? (
                    <div className="text-center">
                        <FileCheck2 className="h-16 w-16 mx-auto text-primary" />
                        <p className="mt-4 font-semibold">Your PDF is ready!</p>
                        <p className="text-muted-foreground text-xs">Use the buttons below to download.</p>
                    </div>
                ) : (
                    <p className="text-muted-foreground">...</p>
                )}
            </div>
        </CardContent>
         <CardFooter className="flex gap-2">
            <Button onClick={handleDownload} disabled={!state.data} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button onClick={handleCopy} variant="outline" disabled={!state.data} className="w-full">
                <ClipboardCopy className="mr-2 h-4 w-4" /> Copy
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
