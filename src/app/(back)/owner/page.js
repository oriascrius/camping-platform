'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineClipboardCheck,
  HiOutlineShoppingCart,
  HiOutlineChartBar,
  HiOutlineCalendar
} from 'react-icons/hi';

export default function OwnerDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalActivities: 0,
    activeActivities: 0,
    monthlyRevenue: 0,
    pendingBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/owner/dashboard/stats');
          const data = await response.json();
          if (response.ok) {
            setStats(data);
          }
        } catch (error) {
          console.error('獲取統計資料失敗:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStats();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8E7B]" />
      </div>
    );
  }

  return (
    <div className="h-full">
      <h1 className="text-2xl font-bold text-[#2C4A3B] mb-8">數據中心</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
        {/* 總訂單數 */}
        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#E8F0EB] rounded-lg">
              <HiOutlineShoppingCart className="w-6 h-6 text-[#2C4A3B]" />
            </div>
            <span className="text-sm text-[#6B8E7B]">總訂單</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-[#2C4A3B]">
              {stats.totalBookings}
            </h3>
            <span className="text-xs text-[#6B8E7B]">筆訂單</span>
          </div>
        </div>

        {/* 總營收 */}
        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#E8F0EB] rounded-lg">
              <HiOutlineCurrencyDollar className="w-6 h-6 text-[#2C4A3B]" />
            </div>
            <span className="text-sm text-[#6B8E7B]">總營收</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-[#2C4A3B]">
              ${stats.totalRevenue.toLocaleString()}
            </h3>
            <span className="text-xs text-[#6B8E7B]">新台幣</span>
          </div>
        </div>

        {/* 本月營收 */}
        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#E8F0EB] rounded-lg">
              <HiOutlineChartBar className="w-6 h-6 text-[#2C4A3B]" />
            </div>
            <span className="text-sm text-[#6B8E7B]">本月營收</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-[#2C4A3B]">
              ${stats.monthlyRevenue.toLocaleString()}
            </h3>
            <span className="text-xs text-[#6B8E7B]">新台幣</span>
          </div>
        </div>

        {/* 待處理訂單 */}
        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#FFE4C8] rounded-lg">
              <HiOutlineClipboardCheck className="w-6 h-6 text-[#95603B]" />
            </div>
            <span className="text-sm text-[#95603B]">待處理訂單</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-[#95603B]">
              {stats.pendingBookings}
            </h3>
            <span className="text-xs text-[#95603B]">筆訂單</span>
          </div>
        </div>

        {/* 總活動數 */}
        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#E8F0EB] rounded-lg">
              <HiOutlineCalendar className="w-6 h-6 text-[#2C4A3B]" />
            </div>
            <span className="text-sm text-[#6B8E7B]">總活動數</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-[#2C4A3B]">
              {stats.totalActivities}
            </h3>
            <span className="text-xs text-[#6B8E7B]">個活動</span>
          </div>
        </div>

        {/* 進行中活動 */}
        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#E8F0EB] rounded-lg">
              <HiOutlineUsers className="w-6 h-6 text-[#2C4A3B]" />
            </div>
            <span className="text-sm text-[#6B8E7B]">進行中活動</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-[#2C4A3B]">
              {stats.activeActivities}
            </h3>
            <span className="text-xs text-[#6B8E7B]">個活動</span>
          </div>
        </div>
      </div>
    </div>
  );
} 