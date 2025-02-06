'use client';

import { useSession } from 'next-auth/react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const { status } = useSession();

  // 如果正在檢查登入狀態，顯示載入中
  if (status === 'loading') {
    return <div>載入中...</div>;
  }

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