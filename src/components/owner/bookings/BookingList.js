"use client";
import { useState, useEffect } from 'react';
import MuiDataGrid from '../common/MuiDataGrid';
import { showErrorToast } from '../common/FormModal';
import { HiEye, HiPencilAlt, HiTrash } from 'react-icons/hi';

export default function BookingList() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  // 操作按鈕渲染函數
  const ActionsCell = ({ id }) => (
    <div className="flex space-x-2">
      <button onClick={() => handleView(id)}>
        <HiEye className="w-5 h-5 text-blue-600 hover:text-blue-800" />
      </button>
      <button onClick={() => handleEdit(id)}>
        <HiPencilAlt className="w-5 h-5 text-green-600 hover:text-green-800" />
      </button>
      <button onClick={() => handleDelete(id)}>
        <HiTrash className="w-5 h-5 text-red-600 hover:text-red-800" />
      </button>
    </div>
  );

  // 狀態單元格渲染函數
  const StatusCell = ({ value }) => {
    const statusMap = {
      'pending': { text: '待確認', class: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { text: '已確認', class: 'bg-green-100 text-green-800' },
      'cancelled': { text: '已取消', class: 'bg-red-100 text-red-800' }
    };
    const status = statusMap[value] || statusMap.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${status.class}`}>
        {status.text}
      </span>
    );
  };

  // 付款狀態單元格渲染函數
  const PaymentStatusCell = ({ value }) => {
    const paymentStatusMap = {
      'pending': { text: '未付款', class: 'bg-red-100 text-red-800' },
      'paid': { text: '已付款', class: 'bg-green-100 text-green-800' },
      'refunded': { text: '已退款', class: 'bg-gray-100 text-gray-800' }
    };
    const status = paymentStatusMap[value] || paymentStatusMap.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${status.class}`}>
        {status.text}
      </span>
    );
  };

  // 定義表格欄位
  const columns = [
    { 
      field: 'booking_id', 
      headerName: '預訂編號',
      width: 120,
      valueFormatter: (params) => `#${String(params.value || '').padStart(6, '0')}`
    },
    { 
      field: 'booking_date',
      headerName: '預訂日期',
      width: 180,
      valueGetter: (params) => {
        return params.row?.booking_date;
      },
      renderCell: (params) => {
        const dateStr = params.row?.booking_date;
        if (!dateStr) return '';

        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return '';

          const formattedDate = new Intl.DateTimeFormat('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Taipei'
          }).format(date);

          return formattedDate;
        } catch (error) {
          console.error('日期格式化錯誤:', error);
          return '';
        }
      }
    },
    {
      field: 'activity_name',
      headerName: '活動/營位',
      width: 300,
      valueGetter: (params) => {
        return params.row;
      },
      renderCell: (params) => {
        const row = params.row;
        if (!row) return '';

        // 組合活動名稱和標題
        const activity = row.activity_name 
          ? `${row.activity_name}${row.activity_title ? ` - ${row.activity_title}` : ''}`
          : '';
        const spot = row.spot_name || '';

        return (
          <div className="flex flex-col py-2">
            <span className="text-sm font-medium">{activity}</span>
            {spot && <span className="text-xs text-gray-600">{spot}</span>}
          </div>
        );
      }
    },
    { 
      field: 'contact_name', 
      headerName: '聯絡人',
      width: 120 
    },
    { 
      field: 'contact_phone', 
      headerName: '聯絡電話',
      width: 150 
    },
    { 
      field: 'quantity', 
      headerName: '數量',
      width: 80,
      type: 'number'
    },
    { 
      field: 'total_price', 
      headerName: '總金額',
      width: 120,
      type: 'number',
      valueFormatter: (params) => {
        console.log('總金額值:', params);
        
        if (!params) return '';

        try {
          const price = Math.round(Number(params));
          
          return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(price);
        } catch (error) {
          console.error('金額格式化錯誤:', error);
          return '';
        }
      }
    },
    { 
      field: 'payment_status', 
      headerName: '付款狀態',
      width: 100,
      renderCell: (params) => <PaymentStatusCell value={params.value} />
    },
    { 
      field: 'status', 
      headerName: '訂單狀態',
      width: 100,
      renderCell: (params) => <StatusCell value={params.value} />
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 150,
      sortable: false,
      renderCell: (params) => <ActionsCell id={params.id} />
    }
  ];

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
        const bookingsWithId = result.data.map(booking => ({
          ...booking,
          id: booking.booking_id
        }));
        console.log('API 返回的第一筆數據:', bookingsWithId[0]);
        console.log('第一筆數據的金額:', bookingsWithId[0]?.total_price);
        setBookings(bookingsWithId);
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
    const booking = bookings.find(b => b.id === id);
  };

  const handleEdit = (id) => {
    const booking = bookings.find(b => b.id === id);
  };

  const handleDelete = (id) => {
    const booking = bookings.find(b => b.id === id);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">訂單管理</h1>
      <div style={{ height: 600, width: '100%', overflow: 'auto' }}>
        <MuiDataGrid
          rows={bookings}
          columns={columns}
          loading={loading}
          checkboxSelection
          getRowId={(row) => row.booking_id}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: {
              sortModel: [{ field: 'booking_date', sort: 'desc' }]
            }
          }}
          sx={{
            '& .MuiDataGrid-main': {
              // 確保內容可以水平滾動
              overflow: 'auto !important'
            },
            '& .MuiDataGrid-virtualScroller': {
              // 允許水平滾動
              overflow: 'auto !important'
            }
          }}
        />
      </div>
    </div>
  );
}
