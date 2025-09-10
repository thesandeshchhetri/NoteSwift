'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6 text-center">
      <svg
        width="240"
        height="120"
        viewBox="0 0 350 150"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          className="noteswift-path"
          d="M10 80 Q 20 20, 40 60 T 60 80 C 70 120, 80 120, 90 80 Q 100 40, 110 80 T 130 60 C 140 40, 150 40, 160 60 L 165 80 M 158 68 L 172 72 M 180 80 Q 185 60, 195 60 T 210 80 C 215 100, 225 100, 230 80 L 235 60 C 240 40, 250 40, 260 60 Q 270 80, 280 60 T 300 80 M 275 60 L 285 60 M 310 80 L 310 50 Q 310 30, 320 30 T 330 50 L 330 80 M 300 70 L 340 70"
          stroke="currentColor"
          strokeWidth="4"
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
      return; // Wait for the auth state to be determined
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // If user is not logged in and tries to access a private route, redirect to login
    if (!user && !isPublicRoute) {
      router.push('/login');
    }

    // If user is logged in and tries to access a public route, redirect to home
    if (user && isPublicRoute) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // While loading, or if a redirect is imminent, show the loading screen.
  if (loading || (!user && !isPublicRoute) || (user && isPublicRoute)) {
    return <LoadingScreen />;
  }

  // Otherwise, the user is authorized for the current route, so render the children.
  return <>{children}</>;
}
