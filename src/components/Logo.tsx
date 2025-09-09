import { NotebookText } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 p-2">
      <NotebookText className="h-8 w-8 text-primary" />
      <h1 className="text-xl font-bold text-foreground">NoteSwift</h1>
    </div>
  );
}
