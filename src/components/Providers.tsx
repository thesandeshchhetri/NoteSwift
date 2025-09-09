'use client';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotesProvider } from '@/contexts/NotesContext';
import { FilterProvider } from '@/contexts/FilterContext';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotesProvider>
        <FilterProvider>
          {children}
          <Toaster />
        </FilterProvider>
      </NotesProvider>
    </AuthProvider>
  );
}
