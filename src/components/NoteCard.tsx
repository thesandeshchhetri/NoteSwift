'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Note } from '@/types';
import { Button } from './ui/button';
import { MoreHorizontal, Edit, Trash2, Bell } from 'lucide-react';
import { useNotes } from '@/contexts/NotesContext';
import { format, parseISO } from 'date-fns';
import { TagBadge } from './TagBadge';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
}

export function NoteCard({ note, onEdit }: NoteCardProps) {
  const { deleteNote } = useNotes();
  
  const handleDelete = () => {
    // A confirmation dialog would be better for UX, but for simplicity:
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNote(note.id);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-row items-start justify-between">
        <div className="space-y-1.5">
          <CardTitle>{note.title}</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            {note.reminderSet && note.reminderAt && (
              <Bell className="w-4 h-4 mr-2 text-primary" />
            )}
            <CardDescription>
              {format(parseISO(note.updatedAt), 'MMMM d, yyyy')}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(note)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-4">
          {note.content}
        </p>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        {note.tags.map(tag => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </CardFooter>
    </Card>
  );
}
