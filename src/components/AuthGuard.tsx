'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Logo } from './Logo';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];
const ADMIN_ROUTES = ['/admin'];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until the auth state is resolved
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

    if (!user && !isPublicRoute) {
      router.push('/login');
    }

    if (user && isPublicRoute) {
      router.push('/');
    }

    if (user && isAdminRoute && user.role !== 'superadmin' && user.role !== 'admin') {
        router.push('/');
    }

  }, [user, loading, pathname, router]);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  // While loading, or if a redirect is imminent, render a loading screen.
  if (loading || (!user && !isPublicRoute) || (user && isPublicRoute) || (user && isAdminRoute && user.role !== 'superadmin' && user.role !== 'admin')) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Logo />
        </div>
    );
  }

  // Otherwise, render the children
  return <>{children}</>;
}
