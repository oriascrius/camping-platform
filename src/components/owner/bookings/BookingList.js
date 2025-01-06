"use client";
import { useState, useEffect, useMemo } from 'react';
import DataTable from '../common/DataTable';
import { HiEye, HiPencilAlt, HiTrash } from 'react-icons/hi';

export default function BookingList() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [sorting, setSorting] = useState([{ id: 'booking_date', desc: true }]);

  // 定義表格欄位
  const columns = useMemo(() => [
    {
      id: 'booking_id',
      header: '預訂編號',
      accessorFn: row => `#${String(row.booking_id || '').padStart(6, '0')}`,
      size: 120,
    },
    {
      id: 'booking_date',
      header: '購買日期',
      accessorFn: row => {
        try {
          const date = new Date(row.booking_date);
          return new Intl.DateTimeFormat('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Taipei'
          }).format(date);
        } catch {
          return '';
        }
      },
      size: 150,
    },
    {
      id: 'activity',
      header: '活動/營位',
      cell: ({ row }) => {
        const activity = row.original.activity_name 
          ? `${row.original.activity_name}${row.original.activity_title ? ` - ${row.original.activity_title}` : ''}`
          : '';
        const spot = row.original.spot_name || '';
        
        return (
          <div className="flex flex-col py-2">
            <span className="text-sm font-medium">{activity}</span>
            {spot && <span className="text-xs text-gray-600">{spot}</span>}
          </div>
        );
      },
      size: 250,
    },
    {
      id: 'dates',
      header: '入住期間',
      cell: ({ row }) => {
        const checkIn = row.original.check_in_date ? new Date(row.original.check_in_date) : null;
        const checkOut = row.original.check_out_date ? new Date(row.original.check_out_date) : null;
        
        if (!checkIn || !checkOut) return '-';
        
        return (
          <div className="flex flex-col py-1">
            <div className="text-sm">
              入住：{new Intl.DateTimeFormat('zh-TW', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              }).format(checkIn)}
            </div>
            <div className="text-sm">
              退房：{new Intl.DateTimeFormat('zh-TW', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              }).format(checkOut)}
            </div>
          </div>
        );
      },
      size: 150,
    },
    {
      id: 'contact_name',
      header: '聯絡人',
      accessorKey: 'contact_name',
      size: 120,
    },
    {
      id: 'contact_phone',
      header: '聯絡電話',
      accessorKey: 'contact_phone',
      size: 150,
    },
    {
      id: 'quantity',
      header: '數量',
      accessorKey: 'quantity',
      size: 80,
    },
    {
      id: 'total_price',
      header: '總金額',
      accessorFn: row => {
        const price = Math.round(Number(row.total_price));
        return new Intl.NumberFormat('zh-TW', {
          style: 'currency',
          currency: 'TWD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(price);
      },
      size: 120,
    },
    {
      id: 'payment_status',
      header: '付款狀態',
      cell: ({ row }) => {
        const statusMap = {
          'pending': { text: '未付款', class: 'bg-red-100 text-red-800' },
          'paid': { text: '已付款', class: 'bg-green-100 text-green-800' },
          'refunded': { text: '已退款', class: 'bg-gray-100 text-gray-800' }
        };
        const status = statusMap[row.original.payment_status] || statusMap.pending;
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${status.class}`}>
            {status.text}
          </span>
        );
      },
      size: 100,
    },
    {
      id: 'status',
      header: '訂單狀態',
      cell: ({ row }) => {
        const statusMap = {
          'pending': { text: '待確認', class: 'bg-yellow-100 text-yellow-800' },
          'confirmed': { text: '已確認', class: 'bg-green-100 text-green-800' },
          'cancelled': { text: '已取消', class: 'bg-red-100 text-red-800' }
        };
        const status = statusMap[row.original.status] || statusMap.pending;
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${status.class}`}>
            {status.text}
          </span>
        );
      },
      size: 100,
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <button onClick={() => handleView(row.original.booking_id)}>
            <HiEye className="w-5 h-5 text-blue-600 hover:text-blue-800" />
          </button>
          <button onClick={() => handleEdit(row.original.booking_id)}>
            <HiPencilAlt className="w-5 h-5 text-green-600 hover:text-green-800" />
          </button>
          <button onClick={() => handleDelete(row.original.booking_id)}>
            <HiTrash className="w-5 h-5 text-red-600 hover:text-red-800" />
          </button>
        </div>
      ),
      size: 150,
    },
  ], []);

  // 獲取訂單數據
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/owner/bookings');
      const result = await response.json();
      
      if (result.success) {
        setBookings(result.data);
      } else {
        showErrorToast(result.message || '獲取訂單失敗');
      }
    } catch (error) {
      console.error('請求失敗:', error);
      showErrorToast('獲取訂單數據失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理操作按鈕事件
  const handleView = (id) => {
    const booking = bookings.find(b => b.booking_id === id);
    // 處理查看邏輯
  };

  const handleEdit = (id) => {
    const booking = bookings.find(b => b.booking_id === id);
    // 處理編輯邏輯
  };

  const handleDelete = (id) => {
    const booking = bookings.find(b => b.booking_id === id);
    // 處理刪除邏輯
  };

  if (loading) {
    return <div className="p-6">載入中...</div>;
  }

  return (
    <div className="h-screen p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-6 flex-shrink-0">訂單管理</h1>
      <div className="flex-1">
        <DataTable
          data={bookings}
          columns={columns}
          sorting={sorting}
          setSorting={setSorting}
          pageSize={15}
        />
      </div>
    </div>
  );
}
