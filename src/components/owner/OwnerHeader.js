'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function OwnerHeader() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/' 
      });
    } catch (error) {
      console.error('登出錯誤:', error);
    }
  };

  return (
    <header className="bg-white shadow h-16">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">營地管理系統</h1>
        </div>
        
        <div className="flex items-center space-x-4 relative">
          <div className="text-sm text-gray-600">
            {session?.user?.name || '營主'} 
          </div>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 focus:outline-none"
          >
            {session?.user?.name?.[0] || 'O'}
          </button>

          {/* 下拉選單 */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <span className="mr-2">🚪</span>
                  登出系統
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 