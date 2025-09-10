'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until the auth state is resolved
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // If there's no user and the route is not public, redirect to login
    if (!user && !isPublicRoute) {
      router.push('/login');
    }

    // If there is a user and the route is public, redirect to the main app
    if (user && isPublicRoute) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // While loading, or if a redirect is imminent, render nothing.
  if (loading || (!user && !isPublicRoute) || (user && isPublicRoute)) {
    return null;
  }

  // Otherwise, render the children
  return <>{children}</>;
}
