'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from './ui/skeleton';

const PUBLIC_ROUTES = ['/login', '/signup'];

const LoadingScreen = () => (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M4 5.5C4 4.39543 4.89543 3.5 6 3.5H13.5417C14.6853 3.5 15.741 4.0928 16.3883 5.05361L18.7766 8.94639C19.4239 9.9072 18.6853 11.1 17.5417 11.1H10C8.89543 11.1 8 10.2046 8 9.1V5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 9.1C8 7.99543 8.89543 7.1 10 7.1H17.5417C18.6853 7.1 19.741 8.0928 20.3883 9.05361L20.7766 9.64639C21.4239 10.6072 20.6853 11.8 19.5417 11.8H12C10.8954 11.8 10 10.8046 10 9.7V9.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"></path><path d="M12 11.8C12 10.6954 12.8954 9.8 14 9.8H19.5417C20.6853 9.8 21.3239 11.0072 20.7766 11.9464L18.3883 15.8464C17.741 16.8072 16.6853 17.4 15.5417 17.4H8C5.79086 17.4 4 15.6091 4 13.4V5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></g></svg>
        </div>
        <div className="space-y-2 text-center">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
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
