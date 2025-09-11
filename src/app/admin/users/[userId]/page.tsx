'use client';
import { useEffect, useState } from 'react';
import type { Note, User } from '@/types';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { UserNotesTable } from '@/components/admin/UserNotesTable';
import { buttonVariants } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"

export default function UserNotesPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const [notes, setNotes] = useState<Note[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchUserNotes = async () => {
    if (!userId) return;
    setLoading(true);
    try {
        const db = await getDb();
        // Fetch user's notes
        const notesQuery = query(collection(db, 'notes'), where('userId', '==', userId), where('deletedAt', '==', null));
        const notesSnapshot = await getDocs(notesQuery);
        const notesList = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Note[];
        setNotes(notesList);

    } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user notes.' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchUserData() {
        if (!userId) return;
        try {
            const db = await getDb();
            // Fetch user details
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            if(userDoc.exists()) {
                setUser({ id: userDoc.id, ...userDoc.data() } as User);
            }
        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user details.' });
        }
    }
    fetchUserData();
    fetchUserNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, toast]);

  const handleDeleteRequest = (note: Note) => {
    setNoteToDelete(note);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    try {
        const db = await getDb();
        const noteRef = doc(db, 'notes', noteToDelete.id);
        await updateDoc(noteRef, { deletedAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Note moved to recently deleted.' });
        fetchUserNotes(); // Refresh the notes list
    } catch (e) {
        console.error("Error deleting document: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete note.' });
    } finally {
        setIsDeleteDialogOpen(false);
        setNoteToDelete(null);
    }
  };
  
  return (
    <>
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {user ? `${user.username}'s Notes` : 'User Notes'}
                    </h2>
                    <p className="text-muted-foreground">
                        {user ? `Viewing all active notes for ${user.email}` : 'Loading user details...'}
                    </p>
                </div>
                <Link href="/admin/users" className={cn(buttonVariants({variant: 'outline'}))}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Users
                </Link>
        </div>
        <UserNotesTable notes={notes} loading={loading} onDeleteNote={handleDeleteRequest} />
        </div>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action will move the note "{noteToDelete?.title}" to this user's recently deleted folder. They can restore it for up to 30 days. This action cannot be undone by you directly.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete Note</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
