'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import type { Note } from '@/types';
import { summarizeNoteForSearch } from '@/ai/flows/summarize-note-for-search';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

interface NotesContextType {
  notes: Note[];
  deletedNotes: Note[];
  addNote: (noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId' | 'deletedAt'> & { reminderAt: Date | null }) => Promise<void>;
  updateNote: (noteId: string, noteData: Partial<Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId' | 'deletedAt'>>) => Promise<void>;
  deleteNote: (noteId: string) => void;
  restoreNote: (noteId: string) => void;
  permanentlyDeleteNote: (noteId: string) => void;
  isProcessing: boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const toNote = useCallback((document: any): Note => {
    const data = document.data();
    return {
        id: document.id,
        userId: data.userId,
        title: data.title,
        content: data.content,
        tags: data.tags,
        summary: data.summary,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        reminderSet: data.reminderSet,
        reminderAt: data.reminderAt ? (data.reminderAt as Timestamp).toDate().toISOString() : null,
        deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate().toISOString() : null,
    };
  }, []);

  useEffect(() => {
    if (user) {
      let unsubscribeNotes: () => void = () => {};
      let unsubscribeDeletedNotes: () => void = () => {};

      const setupListeners = async () => {
        try {
          const db = await getDb();
          const q = query(collection(db, 'notes'), where('userId', '==', user.id), where('deletedAt', '==', null));
          unsubscribeNotes = onSnapshot(q, (querySnapshot) => {
            const notesData = querySnapshot.docs.map(toNote);
            setNotes(notesData);
          }, (error) => {
            console.error("Error fetching notes:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch notes.' });
          });

          const deletedQ = query(collection(db, 'notes'), where('userId', '==', user.id), where('deletedAt', '!=', null));
          unsubscribeDeletedNotes = onSnapshot(deletedQ, (querySnapshot) => {
            const deletedNotesData = querySnapshot.docs.map(toNote);
            setDeletedNotes(deletedNotesData);
          }, (error) => {
            console.error("Error fetching deleted notes:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch deleted notes.' });
          });
        } catch (error) {
            console.error("Failed to setup listeners:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not set up note listeners.' });
        }
      };

      setupListeners();

      return () => {
        unsubscribeNotes();
        unsubscribeDeletedNotes();
      };
    } else {
      setNotes([]);
      setDeletedNotes([]);
    }
  }, [user, toast, toNote]);

  const addNote = async (noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId' | 'deletedAt'> & { reminderAt: Date | null }) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', 'description': 'You must be logged in to add a note.' });
      return;
    }
    setIsProcessing(true);
    let noteRef;
    try {
      const db = await getDb();
      const newNote = {
        userId: user.id,
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags,
        summary: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reminderSet: noteData.reminderSet || false,
        reminderAt: noteData.reminderAt ? Timestamp.fromDate(noteData.reminderAt) : null,
        deletedAt: null,
      };

      noteRef = await addDoc(collection(db, 'notes'), newNote);
      toast({ title: 'Success', description: 'Note created successfully.' });

      // Run summarization in the background
      summarizeNoteForSearch({ note: noteData.content })
        .then(async (summaryResult) => {
          if (noteRef) {
            await updateDoc(noteRef, { summary: summaryResult.summary, updatedAt: serverTimestamp() });
          }
        })
        .catch((aiError) => {
          console.error('Background AI summarization failed:', aiError);
          // Optional: You could add a quiet failure notification here if needed
        });

    } catch (error) {
      console.error('Failed to add note:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create note. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateNote = async (noteId: string, noteData: Partial<Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId' | 'deletedAt'>>) => {
    setIsProcessing(true);
    try {
      const db = await getDb();
      const noteRef = doc(db, 'notes', noteId);
      const updatePayload: any = {
        ...noteData,
        updatedAt: serverTimestamp(),
      };
      
      if (noteData.content) {
        const { summary } = await summarizeNoteForSearch({ note: noteData.content });
        updatePayload.summary = summary;
      }
      if (noteData.reminderAt) {
        updatePayload.reminderAt = Timestamp.fromDate(new Date(noteData.reminderAt));
      }

      await updateDoc(noteRef, updatePayload);
      toast({ title: 'Success', description: 'Note updated successfully.' });
    } catch (error) {
      console.error('Failed to update note:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update note. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const db = await getDb();
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, { deletedAt: serverTimestamp() });
      toast({ title: 'Success', description: 'Note moved to recently deleted.' });
    } catch(e) {
        console.error("Error deleting document: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete note.' });
    }
  };

  const restoreNote = async (noteId: string) => {
    try {
      const db = await getDb();
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, { deletedAt: null });
      toast({ title: 'Success', description: 'Note restored.' });
    } catch(e) {
        console.error("Error restoring document: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not restore note.' });
    }
  };

  const permanentlyDeleteNote = async (noteId: string) => {
    try {
      const db = await getDb();
      const noteRef = doc(db, 'notes', noteId);
      await deleteDoc(noteRef);
      toast({ title: 'Success', description: 'Note permanently deleted.' });
    } catch (e) {
        console.error("Error permanently deleting document: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not permanently delete note.' });
    }
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
