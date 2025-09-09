'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import type { Note, User } from '@/types';
import { summarizeNoteForSearch } from '@/ai/flows/summarize-note-for-search';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import emailjs from '@emailjs/browser';


interface NotesContextType {
  notes: Note[];
  addNote: (noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateNote: (noteId: string, noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId'>, showToast?: boolean) => Promise<void>;
  deleteNote: (noteId: string) => void;
  isProcessing: boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const NOTES_STORAGE_KEY_PREFIX = 'noteswift-notes-';

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const getNotesStorageKey = useCallback(() => {
    return user ? `${NOTES_STORAGE_KEY_PREFIX}${user.id}` : null;
  }, [user]);

  useEffect(() => {
    const storageKey = getNotesStorageKey();
    if (storageKey) {
      try {
        const storedNotes = localStorage.getItem(storageKey);
        if (storedNotes) {
          setNotes(JSON.parse(storedNotes));
        } else {
          setNotes([]);
        }
      } catch (error) {
        console.error('Failed to load notes from local storage', error);
        localStorage.removeItem(storageKey);
        setNotes([]);
      }
    } else {
      setNotes([]);
    }
  }, [user, getNotesStorageKey]);


  const saveNotes = useCallback((newNotes: Note[]) => {
    const storageKey = getNotesStorageKey();
    if (storageKey) {
      setNotes(newNotes);
      localStorage.setItem(storageKey, JSON.stringify(newNotes));
    }
  }, [getNotesStorageKey]);
  
  const checkReminders = useCallback(() => {
    if (!user) return;

    const now = new Date();
    const userNotes = notes;

    const dueNotes = userNotes.filter(note => 
      note.reminderSet && 
      note.reminderAt && 
      new Date(note.reminderAt) <= now
    );

    dueNotes.forEach(note => {
      if (Notification.permission === 'granted') {
        new Notification('Note Reminder', {
          body: `This is a reminder for your note: "${note.title}"`,
        });
      }

      emailjs.send('Noteswift', 'Noteswift', {
          to_email: user.email,
          subject: `Reminder for your note: ${note.title}`,
          message: `This is a reminder for your note titled "${note.title}". Please log in to NoteSwift to view it.`,
        }, 'ts-Fq9pfLF4zrjo8j')
        .catch(err => console.error('Failed to send reminder email:', err));

      const updatedNote = { ...note, reminderSet: false };
      const { id, userId, createdAt, summary, ...noteData } = updatedNote;
      updateNote(note.id, noteData, false);
    });
  }, [notes, user]);

  useEffect(() => {
    const intervalId = setInterval(checkReminders, 60000);
    return () => clearInterval(intervalId);
  }, [checkReminders]);

  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  const addNote = async (noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add a note.' });
        return;
    }
    setIsProcessing(true);
    try {
      const { summary } = await summarizeNoteForSearch({ note: noteData.content });
      const now = new Date().toISOString();
      const newNote: Note = {
        ...noteData,
        id: now,
        userId: user.id,
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

  const updateNote = async (noteId: string, noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId'>, showToast = true) => {
     setIsProcessing(true);
    try {
      const { summary } = await summarizeNoteForSearch({ note: noteData.content });
      const now = new Date().toISOString();
      const updatedNotes = notes.map(note =>
        note.id === noteId ? { ...note, ...noteData, summary, updatedAt: now } : note
      );
      saveNotes(updatedNotes);
      if (showToast) {
        toast({ title: 'Success', description: 'Note updated successfully.' });
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      if (showToast) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update note summary. Please try again.' });
      }
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
