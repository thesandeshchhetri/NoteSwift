'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

const LoadingScreen = () => (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center">
        <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
        >
            <style>
                {`
                .spinner_V8m1 {
                    animation: spinner_zKVA 2s linear infinite;
                }
                .spinner_qM83 {
                    animation: spinner_YpZS 2s linear infinite;
                }
                .spinner_tD4b {
                    animation: spinner_4j7o 2s linear infinite;
                }
                @keyframes spinner_zKVA {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
                @keyframes spinner_YpZS {
                    0% {
                        stroke-dasharray: 0 150;
                        stroke-dashoffset: 0;
                    }
                    47.5% {
                        stroke-dasharray: 42 150;
                        stroke-dashoffset: -16;
                    }
                    95%, 100% {
                        stroke-dasharray: 42 150;
                        stroke-dashoffset: -59;
                    }
                }
                @keyframes spinner_4j7o {
                    0% {
                        transform: rotate(-90deg);
                    }
                    100% {
                        transform: rotate(270deg);
                    }
                }
                `}
            </style>
            <g className="spinner_V8m1">
                <circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="3" stroke="currentColor" className="spinner_qM83" />
            </g>
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
