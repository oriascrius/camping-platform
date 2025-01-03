'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function OwnerDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalCamps: 0,
    averageRating: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (session?.user?.ownerId) {
        try {
          const response = await fetch(`/api/owner/stats?ownerId=${session.user.ownerId}`);
          const data = await response.json();
          if (data.success) {
            setStats(data.stats);
          }
        } catch (error) {
          console.error('獲取統計資料失敗:', error);
        }
      }
    };

    fetchStats();
  }, [session]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">營地總覽</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 訂單統計 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">總訂單數</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        {/* 營地數量 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">營地數量</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.totalCamps}</p>
            </div>
          </div>
        </div>

        {/* 總收入 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">總收入</p>
              <p className="text-2xl font-semibold text-gray-700">${stats.totalRevenue}</p>
            </div>
          </div>
        </div>

        {/* 平均評分 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">平均評分</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 