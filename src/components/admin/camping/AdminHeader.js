'use client';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">營地管理系統</h1>
        
        <div className="flex items-center gap-4">
          {session?.user && (
            <span className="text-gray-600">
              管理員：{session.user.name || session.user.email}
            </span>
          )}
          
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            登出
          </button>
        </div>
      </div>
    </header>
  );
} 