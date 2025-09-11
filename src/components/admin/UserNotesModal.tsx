
'use client';
import { useEffect, useState } from 'react';
import type { Note, User } from '@/types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea } from "../ui/scroll-area";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserWithNoteCount } from '@/app/admin/page';

interface UserNotesModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserWithNoteCount | null;
    notes: Note[];
    loading: boolean;
    onNoteDeleted: () => void;
}

export function UserNotesModal({ isOpen, onOpenChange, user, notes, loading, onNoteDeleted }: UserNotesModalProps) {
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    
    const sortedNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

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
            onNoteDeleted();
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
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {user ? `${user.username}'s Notes` : 'User Notes'}
                        </DialogTitle>
                        <DialogDescription>
                            {user ? `Viewing all active notes for ${user.email}` : 'Loading user details...'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-36 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : sortedNotes.length > 0 ? (
                                    sortedNotes.map((note) => (
                                    <TableRow key={note.id}>
                                        <TableCell className="font-medium">{note.title}</TableCell>
                                        <TableCell>{format(parseISO(note.updatedAt), 'PPP')}</TableCell>
                                        <TableCell>{note.tags.join(', ')}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteRequest(note)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        This user has no active notes.
                                    </TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

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
