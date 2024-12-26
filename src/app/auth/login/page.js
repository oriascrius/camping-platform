'use client';

import LoginForm from '@/components/auth/LoginForm';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await signIn('credentials', {
        email: email,
        password: password,
        redirect: false, // 設為 false 以手動控制重定向
      });

      if (result?.ok) {
        // 直接強制重定向到後台
        window.location.href = '/admin';
      } else {
        // 處理錯誤
        console.error('登入失敗');
      }
    } catch (error) {
      console.error('登入錯誤:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          登入帳號
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}