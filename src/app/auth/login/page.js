'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 如果已經登入，根據角色重定向
    if (session?.user) {
      if (session.user.isAdmin) {
        router.replace('/admin');
      } else if (session.user.isOwner) {
        router.replace('/owner');
      } else {
        router.replace('/');  // 一般用戶重定向到首頁
      }
    }
  }, [session, router]);

  // 如果正在檢查登入狀態，顯示載入中
  if (status === 'loading') {
    return <div>載入中...</div>;
  }

  // 未登入才顯示登入表單
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center
                      bg-gradient-to-br from-[#F3F4F6] via-white to-[#E5E7EB]
                      p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    );
  }

  return null;  // 已登入狀態下不顯示任何內容（會被重定向）
}