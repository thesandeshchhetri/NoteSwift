'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6 text-center">
      <svg
        width="160"
        height="160"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <style>{`
          .signature-path {
            stroke-dasharray: 800;
            stroke-dashoffset: 800;
            animation: draw 3s ease-in-out infinite;
          }
          @keyframes draw {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
        <path
          className="signature-path"
          d="M10 50 Q20 20 40 50 T70 50 Q85 30 90 50 C95 70 80 90 60 80 S30 70 20 50"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Loading your notes...</h2>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    </div>
  </div>
);


export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; 
    }

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
