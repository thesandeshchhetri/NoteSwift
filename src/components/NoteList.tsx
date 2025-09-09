'use client';
import type { Note } from '@/types';
import { NoteCard } from './NoteCard';
import { useFilter } from '@/contexts/FilterContext';
import { useMemo } from 'react';

interface NoteListProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
}

export function NoteList({ notes, onEditNote }: NoteListProps) {
  const { selectedTag } = useFilter();

  const filteredNotes = useMemo(() => {
    let sortedNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    if (selectedTag) {
      return sortedNotes.filter(note => note.tags.includes(selectedTag));
    }
    return sortedNotes;
  }, [notes, selectedTag]);

  if (filteredNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-24 h-24 mb-4 text-muted-foreground">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M4 5.5C4 4.39543 4.89543 3.5 6 3.5H13.5417C14.6853 3.5 15.741 4.0928 16.3883 5.05361L18.7766 8.94639C19.4239 9.9072 18.6853 11.1 17.5417 11.1H10C8.89543 11.1 8 10.2046 8 9.1V5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 9.1C8 7.99543 8.89543 7.1 10 7.1H17.5417C18.6853 7.1 19.741 8.0928 20.3883 9.05361L20.7766 9.64639C21.4239 10.6072 20.6853 11.8 19.5417 11.8H12C10.8954 11.8 10 10.8046 10 9.7V9.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"></path><path d="M12 11.8C12 10.6954 12.8954 9.8 14 9.8H19.5417C20.6853 9.8 21.3239 11.0072 20.7766 11.9464L18.3883 15.8464C17.741 16.8072 16.6853 17.4 15.5417 17.4H8C5.79086 17.4 4 15.6091 4 13.4V5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
        </div>
        <h2 className="text-xl font-semibold">No notes found</h2>
        <p className="text-muted-foreground">
          {selectedTag 
            ? `There are no notes with the tag "${selectedTag}".` 
            : "Create your first note to get started!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredNotes.map(note => (
        <NoteCard key={note.id} note={note} onEdit={onEditNote} />
      ))}
    </div>
  );
}
