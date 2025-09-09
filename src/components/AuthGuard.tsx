'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { PenLine } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/signup'];

const LoadingScreen = () => (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center">
        <PenLine className="h-16 w-16 animate-spin text-primary" />
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Loading your notes...</h2>
            <p className='text-muted-foreground'>Please wait a moment.</p>
        </div>
      </div>
    </div>
);

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && isPublicRoute) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);
  
  if (loading || (!user && !PUBLIC_ROUTES.includes(pathname)) || (user && PUBLIC_ROUTES.includes(pathname))) {
    return <LoadingScreen />;
  }
  
  return <>{children}</>;
}
