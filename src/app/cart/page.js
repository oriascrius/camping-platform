'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { format, differenceInDays } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '獲取購物車失敗');
      }

      setCartItems(data.cartItems);
    } catch (error) {
      console.error('獲取購物車錯誤:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price).replace('TWD', 'NT$');
  };

  if (loading) {
    return <div className="container mx-auto p-4">載入中...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-gray-600">購物車是空的</p>
        <button
          onClick={() => router.push('/activities')}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          去逛逛
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">購物車</h1>
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-4">
              {/* 活動圖片 */}
              <div className="relative w-32 h-32">
                <Image
                  src={`/uploads/activities/${item.main_image}`}
                  alt={item.activity_name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>

              {/* 活動資訊 */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{item.activity_name}</h2>
                <p className="text-gray-600">{item.title}</p>
                
                {/* 營位資訊 */}
                {item.spot_name && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-500">營位：</span>
                    <span className="text-sm">{item.spot_name}</span>
                  </div>
                )}

                {/* 日期資訊 */}
                {item.start_date && item.end_date && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-500">日期：</span>
                    <span className="text-sm">
                      {format(new Date(item.start_date), 'yyyy/MM/dd')} - 
                      {format(new Date(item.end_date), 'yyyy/MM/dd')}
                      （{calculateDays(item.start_date, item.end_date)}天）
                    </span>
                  </div>
                )}

                {/* 數量和價格 */}
                <div className="mt-2 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-500">數量：</span>
                    <span className="text-sm">{item.quantity}</span>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {formatPrice(item.total_price)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 總計 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center">
            <span className="text-xl font-medium">總計</span>
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(cartItems.reduce((sum, item) => sum + item.total_price, 0))}
            </span>
          </div>
          <button
            onClick={() => router.push('/checkout')}
            className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            前往結帳
          </button>
        </div>
      </div>
    </div>
  );
} 