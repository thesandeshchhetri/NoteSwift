'use client';
import { useEffect, useState } from 'react';
import type { Note, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Plus } from 'lucide-react';
import { UsersTable } from '@/components/admin/UsersTable';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserNotesModal } from '@/components/admin/UserNotesModal';
import { Button } from '@/components/ui/button';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { getUsersAndStats } from '@/ai/flows/get-users-and-stats';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal';
import { deleteUser } from '@/ai/flows/delete-user';
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
import { NotesByDayChart } from '@/components/admin/charts/NotesByDayChart';
import { NotesByHourChart } from '@/components/admin/charts/NotesByHourChart';

export interface UserWithNoteCount extends User {
    noteCount: number;
}
interface ChartData {
    notesByHour: { hour: string; count: number }[];
    notesByDay: { date: string; count: number }[];
}

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [users, setUsers] = useState<UserWithNoteCount[]>([]);
  const [chartData, setChartData] = useState<ChartData>({ notesByHour: [], notesByDay: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<UserWithNoteCount | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [userToTakeActionOn, setUserToTakeActionOn] = useState<UserWithNoteCount | null>(null);

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

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const data = await getUsersAndStats();
      setUsers(data.users as UserWithNoteCount[]);
      setUserCount(data.userCount);
      setNoteCount(data.noteCount);
      setChartData({ notesByHour: data.notesByHour, notesByDay: data.notesByDay });
    } catch (error: any) {
      console.error('Failed to fetch admin data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch admin dashboard data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
      fetchAdminData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleUserCreated = () => {
    fetchAdminData();
  }

  const handleEditUser = (user: UserWithNoteCount) => {
    setUserToTakeActionOn(user);
    setIsEditUserModalOpen(true);
  };
  
  const handleChangePassword = (user: UserWithNoteCount) => {
    setUserToTakeActionOn(user);
    setIsChangePasswordModalOpen(true);
  };
  
  const handleDeleteUser = (user: UserWithNoteCount) => {
    setUserToTakeActionOn(user);
    setIsDeleteUserDialogOpen(true);
  };
  
  const confirmDeleteUser = async () => {
    if (!userToTakeActionOn) return;
    try {
      await deleteUser({ uid: userToTakeActionOn.id });
      toast({ title: 'Success', description: 'User deleted successfully.' });
      fetchAdminData();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete user.' });
    } finally {
      setIsDeleteUserDialogOpen(false);
      setUserToTakeActionOn(null);
    }
  };

  return (
    <>
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
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
                    {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{userCount}</div>}
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{noteCount}</div>}
                </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <NotesByHourChart data={chartData.notesByHour} loading={loading} />
                <NotesByDayChart data={chartData.notesByDay} loading={loading} />
            </div>
            <UsersTable 
              users={users} 
              loading={loading} 
              onViewNotes={handleViewNotes} 
              onUserRoleChanged={fetchAdminData}
              onEditUser={handleEditUser}
              onChangePassword={handleChangePassword}
              onDeleteUser={handleDeleteUser}
            />
        </div>
        
        <UserNotesModal 
            isOpen={isNotesModalOpen}
            onOpenChange={setIsNotesModalOpen}
            user={selectedUser}
            notes={userNotes}
            loading={loadingNotes}
            onNoteDeleted={() => {
              refreshUserNotes();
              fetchAdminData();
            }}
        />

        <CreateUserModal
            isOpen={isCreateUserModalOpen}
            onOpenChange={setIsCreateUserModalOpen}
            onUserCreated={handleUserCreated}
        />

        <EditUserModal
            isOpen={isEditUserModalOpen}
            onOpenChange={setIsEditUserModalOpen}
            user={userToTakeActionOn}
            onUserUpdated={() => {
                fetchAdminData();
                setIsEditUserModalOpen(false);
            }}
        />

        <ChangePasswordModal
            isOpen={isChangePasswordModalOpen}
            onOpenChange={setIsChangePasswordModalOpen}
            user={userToTakeActionOn}
            onPasswordChanged={() => {
                setIsChangePasswordModalOpen(false);
            }}
        />

        <AlertDialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will permanently delete the user "{userToTakeActionOn?.username}" and all of their associated data (including all notes). This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setUserToTakeActionOn(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90">Delete User</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
