'use client';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import OwnerHeader from '@/components/owner/OwnerHeader';
import OwnerSidebar from '@/components/owner/OwnerSidebar';

export default function OwnerLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (typeof window === 'undefined') return;
      if (status === 'loading') return;

      const session = await fetch('/api/auth/session').then(res => res.json());

      if (!session) {
        router.replace('/auth/login');
        return;
      }

      if (!session.user?.isOwner) {
        router.replace('/auth/login');
        return;
      }

      setIsAuthorized(true);
    };

    checkSession();
  }, [session, status, router]);

  if (status === 'loading' || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-100">
      <div className="flex h-full">
        <OwnerSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <OwnerHeader />
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 