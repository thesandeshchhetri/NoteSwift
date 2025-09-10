'use client';
import { useEffect, useState } from 'react';
import type { Note, User } from '@/types';
import { collection, getDocs, query, onSnapshot, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Plus } from 'lucide-react';
import { UsersTable } from '@/components/admin/UsersTable';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserNotesModal } from '@/components/admin/UserNotesModal';
import { Button } from '@/components/ui/button';
import { CreateUserModal } from '@/components/admin/CreateUserModal';

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

  const [selectedUser, setSelectedUser] = useState<UserWithNoteCount | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const toNote = (document: any): Note => {
    const data = document.data();
    return {
        id: document.id,
        userId: data.userId,
        title: data.title,
        content: data.content,
        tags: data.tags,
        summary: data.summary,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        reminderSet: data.reminderSet,
        reminderAt: data.reminderAt ? data.reminderAt.toDate().toISOString() : null,
        deletedAt: data.deletedAt ? data.deletedAt.toDate().toISOString() : null,
    };
  };

  const handleViewNotes = async (user: UserWithNoteCount) => {
    setSelectedUser(user);
    setIsNotesModalOpen(true);
    setLoadingNotes(true);
    try {
        const db = await getDb();
        const notesQuery = query(collection(db, 'notes'), where('userId', '==', user.id), where('deletedAt', '==', null));
        const notesSnapshot = await getDocs(notesQuery);
        const notesList = notesSnapshot.docs.map(toNote);
        setUserNotes(notesList);
    } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user notes.' });
    } finally {
        setLoadingNotes(false);
    }
  };

  const refreshUserNotes = async () => {
    if (selectedUser) {
      handleViewNotes(selectedUser);
    }
  };

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
        setLoading(false);
        return;
    }

    const setupListeners = async () => {
        try {
            const db = await getDb();
            
            const notesUnsubscribe = onSnapshot(collection(db, 'notes'), 
                (snapshot) => setNoteCount(snapshot.size),
                (error) => {
                    console.error("Error fetching notes count:", error);
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch total notes count. Check security rules.' });
                }
            );

            const usersUnsubscribe = onSnapshot(query(collection(db, 'users')), async (usersSnapshot) => {
                const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
                setUserCount(usersList.length);

                const usersWithNoteCounts = await Promise.all(
                    usersList.map(async (user) => {
                        const userNotesQuery = query(collection(db, 'notes'), where('userId', '==', user.id));
                        const notesSnapshot = await getDocs(userNotesQuery);
                        return { ...user, noteCount: notesSnapshot.size };
                    })
                );

                setUsers(usersWithNoteCounts);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching users:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user data. Check security rules.' });
                setLoading(false);
            });

            return () => {
                notesUnsubscribe();
                usersUnsubscribe();
            };
        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to set up admin data listeners.' });
            setLoading(false);
        }
    }
    
    const unsubscribePromise = setupListeners();

    return () => {
        unsubscribePromise.then(unsubscribe => {
            if (unsubscribe) {
                unsubscribe();
            }
        });
    };
  }, [currentUser, toast]);
  

  return (
    <>
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                {currentUser?.role === 'superadmin' && (
                    <Button onClick={() => setIsCreateUserModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create User
                    </Button>
                )}
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
            <UsersTable users={users} loading={loading} onViewNotes={handleViewNotes} />
        </div>
        
        <UserNotesModal 
            isOpen={isNotesModalOpen}
            onOpenChange={setIsNotesModalOpen}
            user={selectedUser}
            notes={userNotes}
            loading={loadingNotes}
            onNoteDeleted={refreshUserNotes}
        />

        <CreateUserModal
            isOpen={isCreateUserModalOpen}
            onOpenChange={setIsCreateUserModalOpen}
        />
    </>
  );
}
