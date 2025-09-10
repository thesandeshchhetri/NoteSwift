'use client';

import * as React from 'react';
import { AppLayout as MainAppLayout } from '@/components/AppLayout';
import { NoteList } from '@/components/NoteList';
import { Input } from '@/components/ui/input';
import { useFilter } from '@/contexts/FilterContext';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/contexts/NotesContext';
import { NoteEditor } from '@/components/NoteEditor';
import type { Note } from '@/types';

export default function Home() {
  const { searchTerm, setSearchTerm } = useFilter();
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Omit<Note, 'userId'> | null>(null);
  const { notes } = useNotes();

  const handleNewNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };
  
  const activeNotes = React.useMemo(() => {
    return notes.filter(note => !note.deletedAt);
  }, [notes]);
  
  const filteredNotes = React.useMemo(() => {
    return activeNotes.filter(note => {
      const searchLower = searchTerm.toLowerCase();
      return (
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        (note.summary && note.summary.toLowerCase().includes(searchLower)) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    });
  }, [activeNotes, searchTerm]);


  return (
    <MainAppLayout>
      <div className="flex flex-col h-full bg-background">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold">My Notes</h1>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search notes..."
              className="w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleNewNote}>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <NoteList notes={filteredNotes} onEditNote={handleEditNote} />
        </main>
      </div>
      <NoteEditor
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        note={editingNote}
      />
    </MainAppLayout>
  );
}
