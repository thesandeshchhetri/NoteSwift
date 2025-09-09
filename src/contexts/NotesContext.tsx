'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import type { Note, User } from '@/types';
import { summarizeNoteForSearch } from '@/ai/flows/summarize-note-for-search';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import emailjs from '@emailjs/browser';


interface NotesContextType {
  notes: Note[];
  deletedNotes: Note[];
  addNote: (noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId' | 'deletedAt'>) => Promise<void>;
  updateNote: (noteId: string, noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId' | 'deletedAt'>, showToast?: boolean) => Promise<void>;
  deleteNote: (noteId: string) => void;
  restoreNote: (noteId: string) => void;
  permanentlyDeleteNote: (noteId: string) => void;
  isProcessing: boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const NOTES_STORAGE_KEY_PREFIX = 'noteswift-notes-';
const DELETED_NOTES_STORAGE_KEY_PREFIX = 'noteswift-deleted-notes-';

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const getNotesStorageKey = useCallback(() => {
    return user ? `${NOTES_STORAGE_KEY_PREFIX}${user.id}` : null;
  }, [user]);

  const getDeletedNotesStorageKey = useCallback(() => {
    return user ? `${DELETED_NOTES_STORAGE_KEY_PREFIX}${user.id}` : null;
  }, [user]);

  useEffect(() => {
    const notesKey = getNotesStorageKey();
    const deletedNotesKey = getDeletedNotesStorageKey();
    if (notesKey && deletedNotesKey) {
      try {
        const storedNotes = localStorage.getItem(notesKey);
        setNotes(storedNotes ? JSON.parse(storedNotes) : []);

        const storedDeletedNotes = localStorage.getItem(deletedNotesKey);
        setDeletedNotes(storedDeletedNotes ? JSON.parse(storedDeletedNotes) : []);
      } catch (error) {
        console.error('Failed to load notes from local storage', error);
        localStorage.removeItem(notesKey);
        localStorage.removeItem(deletedNotesKey);
        setNotes([]);
        setDeletedNotes([]);
      }
    } else {
      setNotes([]);
      setDeletedNotes([]);
    }
  }, [user, getNotesStorageKey, getDeletedNotesStorageKey]);


  const saveNotes = useCallback((newNotes: Note[]) => {
    const storageKey = getNotesStorageKey();
    if (storageKey) {
      setNotes(newNotes);
      localStorage.setItem(storageKey, JSON.stringify(newNotes));
    }
  }, [getNotesStorageKey]);
  
  const saveDeletedNotes = useCallback((newDeletedNotes: Note[]) => {
    const storageKey = getDeletedNotesStorageKey();
    if (storageKey) {
      setDeletedNotes(newDeletedNotes);
      localStorage.setItem(storageKey, JSON.stringify(newDeletedNotes));
    }
  }, [getDeletedNotesStorageKey]);

  const updateNote = useCallback(async (noteId: string, noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId' | 'deletedAt'>, showToast = true) => {
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
  }, [notes, saveNotes, toast]);


  const checkReminders = useCallback(async () => {
    if (!user) return;
  
    const now = new Date();
    const userNotes = notes.filter(note => !note.deletedAt);
  
    for (const note of userNotes) {
      if (note.reminderSet && note.reminderAt && new Date(note.reminderAt) <= now) {
        if (Notification.permission === 'granted') {
          new Notification('Note Reminder', {
            body: `This is a reminder for your note: "${note.title}"`,
          });
        }
  
        try {
          await emailjs.send(
            'Noteswift',
            'Noteswift',
            {
              to_email: user.email,
              subject: `Reminder for your note: ${note.title}`,
              message: `This is a reminder for your note titled "${note.title}". Please log in to NoteSwift to view it.`,
            },
            'ts-Fq9pfLF4zrjo8j'
          );
        } catch (err) {
          console.error('Failed to send reminder email:', err);
        }
  
        const updatedNoteData = { ...note, reminderSet: false, reminderAt: null };
        const { id, userId, createdAt, summary, deletedAt, ...noteDataToUpdate } = updatedNoteData;
        await updateNote(note.id, noteDataToUpdate, false);
      }
    }
  }, [notes, user, updateNote]);

  useEffect(() => {
    const intervalId = setInterval(checkReminders, 60000);
    return () => clearInterval(intervalId);
  }, [checkReminders]);

  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  const addNote = async (noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId' | 'deletedAt'>) => {
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
        reminderSet: noteData.reminderSet || false,
        reminderAt: noteData.reminderAt || null,
        deletedAt: null,
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

  const deleteNote = (noteId: string) => {
    const noteToDelete = notes.find(note => note.id === noteId);
    if (!noteToDelete) return;
    
    const remainingNotes = notes.filter(note => note.id !== noteId);
    const updatedDeletedNote = { ...noteToDelete, deletedAt: new Date().toISOString() };

    saveNotes(remainingNotes);
    saveDeletedNotes([updatedDeletedNote, ...deletedNotes]);
    toast({ title: 'Success', description: 'Note moved to recently deleted.' });
  };
  
  const restoreNote = (noteId: string) => {
    const noteToRestore = deletedNotes.find(note => note.id === noteId);
    if (!noteToRestore) return;

    const remainingDeletedNotes = deletedNotes.filter(note => note.id !== noteId);
    const restoredNote = { ...noteToRestore, deletedAt: null };

    saveDeletedNotes(remainingDeletedNotes);
    saveNotes([restoredNote, ...notes]);
    toast({ title: 'Success', description: 'Note restored.' });
  };

  const permanentlyDeleteNote = (noteId: string) => {
    const updatedDeletedNotes = deletedNotes.filter(note => note.id !== noteId);
    saveDeletedNotes(updatedDeletedNotes);
    toast({ title: 'Success', description: 'Note permanently deleted.' });
  };


  return (
    <NotesContext.Provider value={{ notes, deletedNotes, addNote, updateNote, deleteNote, restoreNote, permanentlyDeleteNote, isProcessing }}>
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
