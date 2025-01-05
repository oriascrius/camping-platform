"use client";
import { useState, useEffect } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';
import { toast } from 'react-hot-toast';
import { HiEye, HiPencilAlt, HiTrash } from 'react-icons/hi';

// 註冊模組
ModuleRegistry.registerModules([
  ClientSideRowModelModule
]);

export default function BookingList() {
  const [rowData, setRowData] = useState([]);

  // 取得訂單資料
  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/owner/bookings');
      const result = await response.json();
      
      if (result.success) {
        setRowData(result.data);
      } else {
        toast.error(result.message || '獲取訂單失敗');
      }
    } catch (error) {
      console.error('請求失敗:', error);
      toast.error('獲取訂單資料失敗');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const columnDefs = [
    { 
      field: 'booking_id', 
      headerName: '訂單編號',
      valueFormatter: params => `#${String(params.value).padStart(6, '0')}`,
      width: 120
    },
    { 
      field: 'booking_date', 
      headerName: '預訂日期',
      valueFormatter: params => new Date(params.value).toLocaleDateString(),
      width: 120
    },
    { 
      field: 'activity_name', 
      headerName: '活動/營位',
      cellRenderer: params => (
        <div>
          <div className="font-medium">{params.data.activity_name}</div>
          {params.data.spot_name && (
            <div className="text-xs text-gray-500">{params.data.spot_name}</div>
          )}
        </div>
      ),
      flex: 1,
      minWidth: 200
    },
    { 
      field: 'contact_name', 
      headerName: '聯絡人',
      width: 120
    },
    { 
      field: 'contact_info', 
      headerName: '聯絡方式',
      cellRenderer: params => (
        <div>
          <div>{params.data.contact_phone}</div>
          <div className="text-xs text-gray-500">{params.data.contact_email}</div>
        </div>
      ),
      flex: 1,
      minWidth: 180
    },
    { 
      field: 'quantity', 
      headerName: '數量',
      width: 100
    },
    { 
      field: 'total_price', 
      headerName: '總金額',
      valueFormatter: params => `NT$ ${Number(params.value).toLocaleString()}`,
      width: 120
    },
    { 
      field: 'status', 
      headerName: '狀態',
      cellRenderer: params => {
        const statusColors = {
          pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
          confirmed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
          cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
        };
        const colors = statusColors[params.value];
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
            ${colors.bg} ${colors.text} border ${colors.border}`}>
            {params.value === 'pending' ? '待確認' : 
             params.value === 'confirmed' ? '已確認' : '已取消'}
          </span>
        );
      },
      width: 120
    },
    { 
      field: 'payment_status', 
      headerName: '付款狀態',
      cellRenderer: params => {
        const paymentStatusColors = {
          pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
          paid: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
          failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
          refunded: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
        };
        const colors = paymentStatusColors[params.value];
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
            ${colors.bg} ${colors.text} border ${colors.border}`}>
            {params.value === 'pending' ? '待付款' :
             params.value === 'paid' ? '已付款' :
             params.value === 'failed' ? '付款失敗' : '已退款'}
          </span>
        );
      },
      width: 120
    },
    {
      headerName: '操作',
      cellRenderer: params => (
        <div className="flex justify-end space-x-2">
          <button 
            className="text-[#6B8E7B] hover:text-[#2C4A3B]"
            onClick={() => handleView(params.data)}
          >
            <HiEye className="w-5 h-5" />
          </button>
          <button 
            className="text-[#6B8E7B] hover:text-[#2C4A3B]"
            onClick={() => handleEdit(params.data)}
          >
            <HiPencilAlt className="w-5 h-5" />
          </button>
          <button 
            className="text-red-400 hover:text-red-600"
            onClick={() => handleDelete(params.data)}
          >
            <HiTrash className="w-5 h-5" />
          </button>
        </div>
      ),
      width: 120,
      sortable: false,
      filter: false
    }
  ];

  const handleView = (data) => {
    console.log('查看訂單:', data);
    // TODO: 實現查看訂單詳情的功能
  };

  const handleEdit = (data) => {
    console.log('編輯訂單:', data);
    // TODO: 實現編輯訂單的功能
  };

  const handleDelete = async (data) => {
    if (window.confirm('確定要刪除此訂單嗎？')) {
      try {
        const response = await fetch(`/api/owner/bookings/${data.booking_id}`, {
          method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
          toast.success('訂單已刪除');
          fetchBookings(); // 重新載入資料
        } else {
          toast.error(result.message || '刪除訂單失敗');
        }
      } catch (error) {
        console.error('刪除失敗:', error);
        toast.error('刪除訂單失敗');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2C4A3B]">訂單管理</h1>
      </div>

      <div 
        className="ag-theme-alpine" 
        style={{ 
          height: '600px', 
          width: '100%',
          '--ag-header-height': '48px',
          '--ag-row-height': '48px',
          '--ag-header-foreground-color': '#374151',
          '--ag-foreground-color': '#374151',
          '--ag-header-background-color': '#F9FAFB',
          '--ag-odd-row-background-color': '#FFFFFF',
          '--ag-row-hover-color': '#F3F4F6',
          '--ag-selected-row-background-color': '#EBF5FF',
          '--ag-font-size': '14px',
        }}
      >
        <AgGridReact
          modules={[ClientSideRowModelModule]}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
          pagination={true}
          paginationPageSize={10}
          animateRows={true}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          enableCellTextSelection={true}
          suppressMovableColumns={true}
        />
      </div>
    </div>
  );
} 