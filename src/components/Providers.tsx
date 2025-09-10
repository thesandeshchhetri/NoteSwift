'use client';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotesProvider } from '@/contexts/NotesContext';
import { FilterProvider } from '@/contexts/FilterContext';
import { Toaster } from '@/components/ui/toaster';
import { AuthGuard } from './AuthGuard';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotesProvider>
        <FilterProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
          <Toaster />
        </FilterProvider>
      </NotesProvider>
    </AuthProvider>
  );
}
