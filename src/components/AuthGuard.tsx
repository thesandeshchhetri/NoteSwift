'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const PUBLIC_ROUTES = ['/login', '/signup'];

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6 text-center">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <g>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M12 3L12 15"
          >
            <animate
              attributeName="d"
              values="M12 3L12 15;M12 3L12 3"
              dur="1s"
              repeatCount="indefinite"
            ></animate>
            <animate
              attributeName="stroke-width"
              values="2;2;4;2;2"
              dur="1s"
              repeatCount="indefinite"
            ></animate>
          </path>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M12 15L19 21"
          >
            <animate
              attributeName="d"
              values="M12 15L19 21;M12 15L12 15"
              begin="0.1s"
              dur="1s"
              repeatCount="indefinite"
            ></animate>
            <animate
              attributeName="stroke-width"
              values="2;2;4;2;2"
              begin="0.1s"
              dur="1s"
              repeatCount="indefinite"
            ></animate>
          </path>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M12 15L5 21"
          >
            <animate
              attributeName="d"
              values="M12 15L5 21;M12 15L12 15"
              begin="0.2s"
              dur="1s"
              repeatCount="indefinite"
            ></animate>
            <animate
              attributeName="stroke-width"
              values="2;2;4;2;2"
              begin="0.2s"
              dur="1s"
              repeatCount="indefinite"
            ></animate>
          </path>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M19 21L5 21"
          >
            <animate
              attributeName="d"
              values="M19 21L5 21;M12 21L12 21"
              begin="0.3s"
              dur="1s"
              repeatCount="indefinite"
            ></animate>
            <animate
              attributeName="stroke-width"
              values="2;2;4;2;2"
              begin="0.3s"
              dur="1s"
              repeatCount="indefinite"
            ></animate>
          </path>
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
      return; // Do nothing while loading
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && isPublicRoute) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  // Determine if we should show the loading screen
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (loading || (!user && !isPublicRoute) || (user && isPublicRoute)) {
    return <LoadingScreen />;
  }

  // Otherwise, the user is authenticated and on the correct page, so we can show the children
  return <>{children}</>;
}
