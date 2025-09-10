'use client';
import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { collection, getDocs, query, getCountFromServer, where, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText } from 'lucide-react';
import { UsersTable } from '@/components/admin/UsersTable';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface UserWithNoteCount extends User {
    noteCount: number;
}

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [users, setUsers] = useState<UserWithNoteCount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
        setLoading(false);
        return;
    }

    let unsubscribe: () => void = () => {};

    async function fetchData() {
        try {
            const db = await getDb();
            
            // Fetch total note count
            const notesCollection = collection(db, 'notes');
            const totalNotesSnapshot = await getCountFromServer(notesCollection);
            setNoteCount(totalNotesSnapshot.data().count);
            
            // Listen for changes to users collection
            const usersQuery = query(collection(db, 'users'));
            unsubscribe = onSnapshot(usersQuery, async (usersSnapshot) => {
                const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
                setUserCount(usersList.length);

                // Fetch note count for each user
                const usersWithNoteCounts = await Promise.all(
                    usersList.map(async (user) => {
                        const userNotesQuery = query(collection(db, 'notes'), where('userId', '==', user.id));
                        const notesSnapshot = await getCountFromServer(userNotesQuery);
                        return { ...user, noteCount: notesSnapshot.data().count };
                    })
                );

                setUsers(usersWithNoteCounts);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching users:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user data. Check security rules.' });
                setLoading(false);
            });

        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch initial admin data.' });
            setLoading(false);
        }
    }
    fetchData();

    return () => unsubscribe();
  }, [currentUser, toast]);
  

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : userCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : noteCount}</div>
          </CardContent>
        </Card>
      </div>
      <UsersTable users={users} loading={loading} />
    </div>
  );
}
