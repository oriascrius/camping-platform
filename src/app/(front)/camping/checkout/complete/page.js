'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaCreditCard, FaMoneyBill } from 'react-icons/fa';

// 狀態對應的中文和顏色配置
const STATUS_MAP = {
  pending: { text: '待確認', color: 'text-yellow-600' },
  confirmed: { text: '已確認', color: 'text-green-600' },
  cancelled: { text: '已取消', color: 'text-red-600' }
};

const PAYMENT_STATUS_MAP = {
  pending: { text: '待付款', color: 'text-yellow-600' },
  paid: { text: '已付款', color: 'text-green-600' },
  failed: { text: '付款失敗', color: 'text-red-600' },
  refunded: { text: '已退款', color: 'text-gray-600' }
};

export default function OrderCompletePage() {
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const bookingId = searchParams.get('bookingId');
        if (!bookingId) {
          toast.error('無效的訂單編號');
          return;
        }

        const response = await fetch(`/api/camping/checkout/complete?bookingId=${bookingId}`);
        if (!response.ok) throw new Error('獲取訂單資料失敗');
        
        const data = await response.json();
        setOrderData(data);
      } catch (error) {
        console.error('獲取訂單資料錯誤:', error);
        toast.error('獲取訂單資料失敗');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">找不到訂單資料</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 訂單成功標題 */}
      <div className="text-center mb-8">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800">訂單完成</h1>
        <p className="text-gray-600 mt-2">
          感謝您的預訂！您的訂單編號為：{orderData.booking_id}
        </p>
      </div>

      {/* 訂單資訊卡片 */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 訂單基本資訊 */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold mb-4">訂單資訊</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">訂單日期</p>
              <p className="font-medium">
                {format(new Date(orderData.created_at), 'yyyy/MM/dd HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-gray-600">付款方式</p>
              <p className="font-medium flex items-center">
                {orderData.payment_method === 'credit_card' ? (
                  <>
                    <FaCreditCard className="mr-2" />
                    信用卡支付
                  </>
                ) : (
                  <>
                    <FaMoneyBill className="mr-2" />
                    銀行轉帳
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600">訂單狀態</p>
              <p className={`font-medium ${STATUS_MAP[orderData.status]?.color || 'text-gray-600'}`}>
                {STATUS_MAP[orderData.status]?.text || orderData.status}
              </p>
            </div>
            <div>
              <p className="text-gray-600">付款狀態</p>
              <p className={`font-medium ${PAYMENT_STATUS_MAP[orderData.payment_status]?.color || 'text-gray-600'}`}>
                {PAYMENT_STATUS_MAP[orderData.payment_status]?.text || orderData.payment_status}
              </p>
            </div>
          </div>
        </div>

        {/* 聯絡人資訊 */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold mb-4">聯絡人資訊</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">姓名</p>
              <p className="font-medium">{orderData.contact_name}</p>
            </div>
            <div>
              <p className="text-gray-600">電話</p>
              <p className="font-medium">{orderData.contact_phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">電子信箱</p>
              <p className="font-medium">{orderData.contact_email}</p>
            </div>
          </div>
        </div>

        {/* 訂單項目 */}
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">預訂項目</h2>
          <div className="space-y-4">
            {orderData.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{item.activity_name}</h3>
                    <p className="text-gray-600">{item.spot_name}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>入住日期：{format(new Date(item.start_date), 'yyyy/MM/dd')}</p>
                  <p>退房日期：{format(new Date(item.end_date), 'yyyy/MM/dd')}</p>
                  <p>數量：{item.quantity} 個</p>
                  <p>單價：NT$ {Math.round(item.unit_price).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 總金額 */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">總金額</span>
              <span className="text-2xl font-bold text-green-600">
                NT$ {Math.round(orderData.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
