'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminHeader from '@/components/admin/camping/AdminHeader';
import AdminSidebar from '@/components/admin/camping/AdminSidebar';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
      router.push('/auth/login');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div>載入中...</div>;
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="bg-gray-100 h-full">
      <div className="flex h-full">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader />
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 