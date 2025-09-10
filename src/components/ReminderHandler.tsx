'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDb } from '@/lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';
import type { Note } from '@/types';

export function ReminderHandler() {
  const { user } = useAuth();

  const toNote = (document: any): Note => {
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
  }

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
      
      if (!querySnapshot.empty) {
        const batch = writeBatch(db);
        const emailjs = (await import('@emailjs/browser')).default;
        
        querySnapshot.forEach((document) => {
            const note = toNote(document);
            if (Notification.permission === 'granted') {
              new Notification('Note Reminder', {
                body: `This is a reminder for your note: "${note.title}"`,
              });
            }
      
            emailjs.send(
                'Noteswift',
                'Noteswift',
                {
                  to_email: user.email,
                  subject: `Reminder for your note: ${note.title}`,
                  message: `This is a reminder for your note titled "${note.title}". Please log in to NoteSwift to view it.`,
                },
                'ts-Fq9pfLF4zrjo8j'
              ).catch(err => {
                console.error('Failed to send reminder email:', err);
              });
            
            const noteRef = doc(db, "notes", note.id);
            batch.update(noteRef, { reminderSet: false, reminderAt: null });
        });
        
        await batch.commit();
      }
    } catch (error) {
        console.error("Error checking reminders:", error);
    }
  }, [user]);

  useEffect(() => {
    // This entire effect only runs on the client
    const requestNotificationPermission = () => {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    };

    requestNotificationPermission();
    checkReminders(); // check once on mount
    const intervalId = setInterval(checkReminders, 60000); // then check every minute
    
    return () => clearInterval(intervalId);
  }, [checkReminders]);

  return null; // This component does not render anything
}
