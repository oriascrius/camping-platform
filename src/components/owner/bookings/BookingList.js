"use client";
import { useState, useEffect } from 'react';
import { HiSearch, HiFilter, HiEye, HiPencilAlt, HiTrash } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

// 狀態標籤顏色配置
const statusColors = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  confirmed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
};

const paymentStatusColors = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  paid: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  refunded: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
};

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // 取得訂單資料
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        payment: paymentFilter
      });

      console.log('發送請求到:', `/api/owner/bookings?${params}`);
      
      const response = await fetch(`/api/owner/bookings?${params}`);
      const result = await response.json();
      
      console.log('API 回應:', result);
      
      if (result.success) {
        setBookings(result.data);
        console.log('設置訂單資料:', result.data);
      } else {
        console.error('獲取訂單失敗:', result.error);
        toast.error(result.message || '獲取訂單失敗');
      }
    } catch (error) {
      console.error('請求失敗:', error);
      toast.error('獲取訂單資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 當組件載入時獲取資料
  useEffect(() => {
    console.log('組件載入，開始獲取資料');
    fetchBookings();
  }, [searchTerm, statusFilter, paymentFilter]);

  // 如果正在載入，顯示載入狀態
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6B8E7B]"></div>
      </div>
    );
  }

  console.log('渲染時的訂單資料:', bookings);

  return (
    <div className="p-6">
      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2C4A3B]">訂單管理</h1>
      </div>

      {/* 搜尋和篩選區 */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* 搜尋框 */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder="搜尋訂單編號、聯絡人..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#A8C2B5]/30 focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B8E7B]" />
          </div>
        </div>

        {/* 狀態篩選 */}
        <div className="flex items-center gap-2">
          <HiFilter className="text-[#6B8E7B]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#A8C2B5]/30 focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]"
          >
            <option value="all">所有狀態</option>
            <option value="pending">待確認</option>
            <option value="confirmed">已確認</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        {/* 付款狀態篩選 */}
        <div className="flex items-center gap-2">
          <HiFilter className="text-[#6B8E7B]" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border border-[#A8C2B5]/30 focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]"
          >
            <option value="all">所有付款狀態</option>
            <option value="pending">待付款</option>
            <option value="paid">已付款</option>
            <option value="failed">付款失敗</option>
            <option value="refunded">已退款</option>
          </select>
        </div>
      </div>

      {/* 訂單列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-[#A8C2B5]/20">
          <thead className="bg-[#F7F9F8]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#2C4A3B]">訂單編號</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#2C4A3B]">預訂日期</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#2C4A3B]">活動/營位</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#2C4A3B]">聯絡人</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#2C4A3B]">聯絡方式</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#2C4A3B]">數量</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#2C4A3B]">總金額</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#2C4A3B]">狀態</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#2C4A3B]">付款狀態</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-[#2C4A3B]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#A8C2B5]/20">
            {bookings.map((booking) => (
              <tr key={booking.booking_id} className="hover:bg-[#F7F9F8]">
                <td className="px-6 py-4 text-sm text-[#2C4A3B]">
                  {`#${String(booking.booking_id).padStart(6, '0')}`}
                </td>
                <td className="px-6 py-4 text-sm text-[#2C4A3B]">
                  {new Date(booking.booking_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-[#2C4A3B]">
                  <div className="font-medium">{booking.activity_name}</div>
                  <div className="text-xs text-gray-500">
                    {booking.spot_name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#2C4A3B]">{booking.contact_name}</td>
                <td className="px-6 py-4 text-sm text-[#2C4A3B]">
                  <div>{booking.contact_phone}</div>
                  <div className="text-xs text-gray-500">{booking.contact_email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#2C4A3B]">{booking.quantity}</td>
                <td className="px-6 py-4 text-sm text-[#2C4A3B]">
                  NT$ {Number(booking.total_price).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                    ${statusColors[booking.status].bg} 
                    ${statusColors[booking.status].text}
                    border ${statusColors[booking.status].border}`}>
                    {booking.status === 'pending' ? '待確認' : 
                     booking.status === 'confirmed' ? '已確認' : '已取消'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                    ${paymentStatusColors[booking.payment_status].bg} 
                    ${paymentStatusColors[booking.payment_status].text}
                    border ${paymentStatusColors[booking.payment_status].border}`}>
                    {booking.payment_status === 'pending' ? '待付款' :
                     booking.payment_status === 'paid' ? '已付款' :
                     booking.payment_status === 'failed' ? '付款失敗' : '已退款'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="text-[#6B8E7B] hover:text-[#2C4A3B]">
                    <HiEye className="w-5 h-5" />
                  </button>
                  <button className="text-[#6B8E7B] hover:text-[#2C4A3B]">
                    <HiPencilAlt className="w-5 h-5" />
                  </button>
                  <button className="text-red-400 hover:text-red-600">
                    <HiTrash className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 