'use client';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/camping/AdminHeader';
import AdminSidebar from '@/components/admin/camping/AdminSidebar';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 確保只在客戶端執行
    if (typeof window === 'undefined') return;

    if (status === 'loading') return;

    if (!session) {
      router.replace('/auth/login');
      return;
    }

    // 檢查是否為管理員
    if (!session.user?.isAdmin) {
      router.replace('/');
      return;
    }

    setIsAuthorized(true);
  }, [session, status, router]);

  // 顯示加載狀態
  if (status === 'loading' || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 確認已授權才顯示管理面板
  return (
    <div className="relative w-full h-full bg-gray-100 overflow-auto">
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