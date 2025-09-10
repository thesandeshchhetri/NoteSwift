'use client';
import { useEffect, useState } from 'react';
import type { Note, User } from '@/types';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { UserNotesTable } from '@/components/admin/UserNotesTable';
import { buttonVariants } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function UserNotesPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const [notes, setNotes] = useState<Note[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        if (!userId) return;
        setLoading(true);
        try {
            const db = await getDb();
            // Fetch user details
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            if(userDoc.exists()) {
                setUser({ id: userDoc.id, ...userDoc.data() } as User);
            }

            // Fetch user's notes
            const notesQuery = query(collection(db, 'notes'), where('userId', '==', userId));
            const notesSnapshot = await getDocs(notesQuery);
            const notesList = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Note[];
            setNotes(notesList);

        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user notes.' });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [userId, toast]);
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">
                    {user ? `${user.username}'s Notes` : 'User Notes'}
                </h2>
                <p className="text-muted-foreground">
                    {user ? `Viewing all notes for ${user.email}` : 'Loading user details...'}
                </p>
            </div>
            <Link href="/admin" className={cn(buttonVariants({variant: 'outline'}))}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Users
            </Link>
      </div>
      <UserNotesTable notes={notes} loading={loading} />
    </div>
  );
}
