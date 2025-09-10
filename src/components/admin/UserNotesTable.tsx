'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import type { Note } from "@/types";
import { format, parseISO } from "date-fns";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea } from "../ui/scroll-area";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserNotesTableProps {
  notes: Note[];
  loading: boolean;
  onDeleteNote: (note: Note) => void;
}

export function UserNotesTable({ notes, loading, onDeleteNote }: UserNotesTableProps) {
    const { user: currentUser } = useAuth();
    const sortedNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
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
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">View Content</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                        <DialogTitle>{note.title}</DialogTitle>
                        <DialogDescription>
                            Last updated on {format(parseISO(note.updatedAt), 'PPP p')}
                        </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] my-4">
                            <pre className="text-sm whitespace-pre-wrap p-4 bg-muted rounded-md font-sans">
                                {note.content}
                            </pre>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
                {currentUser?.role === 'superadmin' && (
                    <Button variant="destructive" size="sm" onClick={() => onDeleteNote(note)}>
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
  );
}
