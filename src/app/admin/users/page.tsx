'use client';
import { useEffect, useState } from 'react';
import type { Note, User } from '@/types';
import { UsersTable } from '@/components/admin/UsersTable';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserNotesModal } from '@/components/admin/UserNotesModal';
import { Button } from '@/components/ui/button';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { getUsersAndStats } from '@/ai/flows/get-users-and-stats';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
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
import { Plus } from 'lucide-react';

export interface UserWithNoteCount extends User {
    noteCount: number;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithNoteCount[]>([]);
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

  const refreshUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsersAndStats();
      setUsers(data.users as UserWithNoteCount[]);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch users.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const refreshUserNotes = async () => {
    if (selectedUser) {
      handleViewNotes(selectedUser);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
      refreshUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleUserCreated = () => {
    refreshUsers();
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
      refreshUsers();
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
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                    <Button onClick={() => setIsCreateUserModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create User
                    </Button>
                )}
            </div>
            <UsersTable 
              users={users} 
              loading={loading} 
              onViewNotes={handleViewNotes} 
              onUserRoleChanged={refreshUsers}
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
              refreshUsers();
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
                refreshUsers();
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
