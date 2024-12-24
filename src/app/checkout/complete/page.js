'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function OrderCompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState(null);
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    if (!bookingId) {
      router.push('/');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/checkout/complete?bookingId=${bookingId}`);
        if (!response.ok) throw new Error('無法獲取訂單資料');
        const data = await response.json();
        console.log('訂單詳情:', data);
        setOrderDetails(data);
      } catch (error) {
        console.error('獲取訂單資料失敗:', error);
        toast.error('無法載入訂單資料');
      }
    };

    fetchOrderDetails();
  }, [bookingId]);

  if (!orderDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">活動訂單完成！</h1>
        <p className="text-gray-600">
          感謝您的預訂，我們已收到您的活動訂單
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">活動訂單編號</h2>
          <p className="text-gray-600">{orderDetails.booking_id}</p>
        </div>

        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold mb-4">活動訂單內容</h2>
          {orderDetails.items.map((item, index) => (
            <div key={index} className="mb-4">
              <h3 className="font-medium">{item.activity_name}</h3>
              <p className="text-gray-600">{item.option_name}</p>
              <p className="text-gray-600">數量: {item.quantity}</p>
              <p className="text-gray-600">
                活動日期: {new Date(item.start_date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">付款資訊</h2>
          <p className="text-gray-600">總金額: NT$ {orderDetails.total_price.toLocaleString()}</p>
          <p className="text-gray-600">付款方式: {
            orderDetails.payment_method === 'credit_card' ? '信用卡' : '銀行轉帳'
          }</p>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">聯絡資訊</h2>
          <p className="text-gray-600">姓名: {orderDetails.contact_name}</p>
          <p className="text-gray-600">電話: {orderDetails.contact_phone}</p>
          <p className="text-gray-600">信箱: {orderDetails.contact_email}</p>
        </div>
      </div>

      <div className="text-center space-x-4">
        <Link 
          href="/bookings" 
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200"
        >
          查看我的活動訂單
        </Link>
        <Link 
          href="/" 
          className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-200"
        >
          返回首頁
        </Link>
      </div>
    </div>
  );
} 