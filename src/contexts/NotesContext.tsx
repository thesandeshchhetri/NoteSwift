'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import type { Note, User } from '@/types';
import { summarizeNoteForSearch } from '@/ai/flows/summarize-note-for-search';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, getDocs, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import emailjs from '@emailjs/browser';

interface NotesContextType {
  notes: Note[];
  deletedNotes: Note[];
  addNote: (noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId' | 'deletedAt'>) => Promise<void>;
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

  const toNote = (doc: any): Note => {
    const data = doc.data();
    return {
        id: doc.id,
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
  }

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
        }
      }

      setupListeners();

      return () => {
        unsubscribeNotes();
        unsubscribeDeletedNotes();
      };
    } else {
      setNotes([]);
      setDeletedNotes([]);
    }
  }, [user, toast]);

  const addNote = async (noteData: Omit<Note, 'id' | 'summary' | 'createdAt' | 'updatedAt' | 'userId' | 'deletedAt'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add a note.' });
      return;
    }
    setIsProcessing(true);
    try {
      const db = await getDb();
      const { summary } = await summarizeNoteForSearch({ note: noteData.content });
      await addDoc(collection(db, 'notes'), {
        ...noteData,
        userId: user.id,
        summary,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reminderSet: noteData.reminderSet || false,
        reminderAt: noteData.reminderAt ? Timestamp.fromDate(new Date(noteData.reminderAt)) : null,
        deletedAt: null,
      });
      toast({ title: 'Success', description: 'Note created successfully.' });
    } catch (error) {
      console.error('Failed to add note:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate note summary. Please try again.' });
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

  const checkReminders = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    
    try {
      const db = await getDb();
      const q = query(
          collection(db, "notes"), 
          where("userId", "==", user.id), 
          where("reminderSet", "==", true),
          where("reminderAt", "<=", Timestamp.fromDate(now))
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach(async (document) => {
          const note = toNote(document);
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
          
          const noteRef = doc(db, "notes", note.id);
          batch.update(noteRef, { reminderSet: false, reminderAt: null });
      });

      if (!querySnapshot.empty) {
          await batch.commit();
      }
    } catch (error) {
        console.error("Error checking reminders:", error);
    }
  }, [user]);

  useEffect(() => {
    const intervalId = setInterval(checkReminders, 60000);
    return () => clearInterval(intervalId);
  }, [checkReminders]);

  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

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
