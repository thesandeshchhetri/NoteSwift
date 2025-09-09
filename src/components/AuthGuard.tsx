'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from './ui/skeleton';
import { Logo } from './Logo';

const PUBLIC_ROUTES = ['/login', '/signup'];

const LoadingScreen = () => (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-24 h-24">
            <Logo />
        </div>
        <div className="space-y-2 text-center">
            <p className='text-lg font-medium'>Loading your notes...</p>
            <p className='text-sm text-muted-foreground'>Please wait a moment.</p>
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
  
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (loading || (!user && !isPublicRoute) || (user && isPublicRoute)) {
    return <LoadingScreen />;
  }
  
  return <>{children}</>;
}
