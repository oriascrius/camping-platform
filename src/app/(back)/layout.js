'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function SessionCheck({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (pathname.startsWith('/admin') && !session) {
      router.replace('/auth/login');
    }
  }, [session, status, router, pathname]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return children;
}

export default function BackLayout({ children }) {
  return (
    <div className="relative w-full h-full bg-gray-100 overflow-auto">
      <SessionProvider>
        <SessionCheck>
          {children}
        </SessionCheck>
      </SessionProvider>
    </div>
  );
}