'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminHeader from '@/components/admin/camping/AdminHeader';
import AdminSidebar from '@/components/admin/camping/AdminSidebar';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 使用 useEffect 來處理重定向
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
      router.push('/auth/login');
    }
  }, [status, session, router]);

  // 載入中狀態
  if (status === 'loading') {
    return <div>載入中...</div>;
  }

  // 如果未登入或非管理員，顯示空白頁面（重定向會在 useEffect 中處理）
  if (!session?.user?.isAdmin) {
    return null;
  }

  // 已登入且是管理員，顯示後台介面
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 