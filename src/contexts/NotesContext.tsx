'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import type { Note } from '@/types';
import { summarizeNoteForSearch } from '@/ai/flows/summarize-note-for-search';
import { useToast } from '@/hooks/use-toast';

interface NotesContextType {
  notes: Note[];
  addNote: (noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (noteId: string, noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteNote: (noteId: string) => void;
  isProcessing: boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const NOTES_STORAGE_KEY = 'noteswift-notes';

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error('Failed to load notes from local storage', error);
      localStorage.removeItem(NOTES_STORAGE_KEY);
    }
  }, []);

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(newNotes));
  };
  
  const addNote = async (noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt'>) => {
    setIsProcessing(true);
    try {
      const { summary } = await summarizeNoteForSearch({ note: noteData.content });
      const now = new Date().toISOString();
      const newNote: Note = {
        ...noteData,
        id: now,
        summary,
        createdAt: now,
        updatedAt: now,
      };
      saveNotes([newNote, ...notes]);
      toast({ title: 'Success', description: 'Note created successfully.' });
    } catch (error) {
      console.error('Failed to add note:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate note summary. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateNote = async (noteId: string, noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt'>) => {
     setIsProcessing(true);
    try {
      const { summary } = await summarizeNoteForSearch({ note: noteData.content });
      const now = new Date().toISOString();
      const updatedNotes = notes.map(note =>
        note.id === noteId ? { ...note, ...noteData, summary, updatedAt: now } : note
      );
      saveNotes(updatedNotes);
      toast({ title: 'Success', description: 'Note updated successfully.' });
    } catch (error) {
      console.error('Failed to update note:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update note summary. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    saveNotes(updatedNotes);
    toast({ title: 'Success', description: 'Note deleted.' });
  };


  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote, isProcessing }}>
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
