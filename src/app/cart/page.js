'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaTrash } from 'react-icons/fa';
import { CalendarIcon, HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCartItems = async () => {
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '獲取購物車失敗');
      }
      const data = await response.json();
      setCartItems(data.cartItems || []);
    } catch (error) {
      console.error('獲取購物車失敗:', error);
      toast.error(error.message);
      if (error.message === '請先登入') {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleRemoveItem = async (cartId) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartId }),
      });

      if (!response.ok) throw new Error('移除項目失敗');
      
      await fetchCartItems();
      window.dispatchEvent(new CustomEvent('cartUpdate'));
      toast.success('已從購物車移除');
    } catch (error) {
      console.error('移除購物車項目失敗:', error);
      toast.error('移除購物車項目失敗');
    }
  };

  const handleUpdateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartId, quantity: newQuantity }),
      });

      if (!response.ok) throw new Error('更新數量失敗');
      
      await fetchCartItems();
      window.dispatchEvent(new CustomEvent('cartUpdate'));
    } catch (error) {
      console.error('更新購物車數量失敗:', error);
      toast.error('更新購物車數量失敗');
    }
  };

  const calculateTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      // 使用最低價格作為計算基準
      const itemPrice = item.min_price || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  if (loading) {
    return <div className="text-center py-8">載入中...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">購物車</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">購物車是空的</p>
          <button
            onClick={() => router.push('/activities')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            去逛逛
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {cartItems.map((item) => (
            <div 
              key={item.cart_id}
              className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg"
            >
              {/* 商品圖片 */}
              <div 
                className="w-full md:w-1/4 h-48 bg-gray-100 rounded-md overflow-hidden cursor-pointer"
                onClick={() => router.push(`/activities/${item.activity_id}`)}
              >
                <Image
                  src={item.main_image ? `/uploads/activities/${item.main_image}` : '/images/default-activity.jpg'}
                  alt={item.activity_name || '活動圖片'}
                  width={300}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 商品資訊 */}
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium hover:text-green-600">
                      {item.activity_name || '未命名活動'}
                    </h3>
                    <p className="text-gray-500">
                      {item.activity_location || ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.cart_id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FaTrash className="h-5 w-5" />
                  </button>
                </div>

                {/* 日期和營位資訊 */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {/* 日期資訊 */}
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      {item.selected_start_date && item.selected_end_date ? (
                        <span>
                          {format(new Date(item.selected_start_date), 'yyyy/MM/dd')} - 
                          {format(new Date(item.selected_end_date), 'yyyy/MM/dd')}
                        </span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          尚未選擇日期
                        </span>
                      )}
                    </div>

                    {/* 營位資訊 */}
                    <div className="flex items-center gap-2">
                      <HomeIcon className="h-5 w-5 text-gray-400" />
                      {item.option_id ? (
                        <span>{item.spot_name}</span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          尚未選擇營位
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 數量和價格 */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded-md">
                        <button
                          onClick={() => handleUpdateQuantity(item.cart_id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-1 border-r hover:bg-gray-100 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="px-4 py-1">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.cart_id, item.quantity + 1)}
                          className="px-3 py-1 border-l hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        {item.price_range}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 警告提示 */}
                {(!item.selected_start_date || !item.selected_end_date || !item.option_id) && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-md text-sm">
                    ⚠️ 請至商品詳細頁完善預訂資訊
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center text-xl font-semibold">
              <span>總金額</span>
              <span className="text-green-600">
                NT$ {calculateTotalAmount().toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
            >
              前往結帳
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 