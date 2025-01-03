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
      console.log('Owner Layout Session:', session);

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
    <div className="relative w-full h-full bg-gray-100 overflow-auto">
      <div className="flex h-full">
        <OwnerSidebar />
        <div className="flex-1">
          <OwnerHeader />
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 