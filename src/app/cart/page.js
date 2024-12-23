'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { CalendarIcon, HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 獲取購物車內容
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  // 更新商品數量
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
      toast.success('已更新數量');
    } catch (error) {
      toast.error('更新數量失敗');
    }
  };

  // 修改刪除函數
  const handleRemoveItem = async (cartId) => {
    if (!cartId) {
      toast.error('無效的購物車項目');
      return;
    }

    try {
      const response = await fetch(`/api/cart/${cartId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '刪除失敗');
      }

      // 成功刪除後，更新購物車列表
      setCartItems(prevItems => prevItems.filter(item => item.id !== cartId));
      toast.success('商品已從購物車中移除');

    } catch (error) {
      console.error('刪除購物車項目失敗:', error);
      toast.error(error.message || '刪除失敗，請稍後再試');
    }
  };

  // 計算總金額
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.total_price || 0);
    }, 0);
  };

  if (loading) {
    return <div className="container mx-auto p-4">載入中...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">購物車</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">購物車是空的</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cartItems.map(item => {
            // 修改圖片路徑指向本地 public/uploads/activities 目錄
            const imageUrl = item.main_image
              ? `/uploads/activities/${item.main_image}`
              : '/images/default-activity.jpg';

            return (
              <div key={item.id || `temp-${Date.now()}-${Math.random()}`} className="relative bg-white p-4 rounded-lg shadow">
                {/* 刪除按鈕 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 防止觸發商品卡片的點擊事件
                    handleRemoveItem(item.id);
                  }}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-600 transition-colors"
                >
                  <FaTrash className="w-4 h-4" />
                </button>

                {/* 商品內容 - 可點擊前往詳細頁 */}
                <div 
                  className="flex gap-6 cursor-pointer"
                  onClick={() => router.push(`/activities/${item.activity_id}`)}
                >
                  {/* 商品圖片 */}
                  <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={item.title || '活動圖片'}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 商品資訊 */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold hover:text-green-600">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{item.subtitle}</p>

                    {/* 日期和營位資訊 */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        {item.start_date && item.end_date ? (
                          <span>
                            {format(new Date(item.start_date), 'yyyy/MM/dd')} - 
                            {format(new Date(item.end_date), 'yyyy/MM/dd')}
                          </span>
                        ) : (
                          <span className="text-amber-500 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            尚未選擇日期
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <HomeIcon className="h-5 w-5 text-gray-400" />
                        {item.spot_name ? (
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
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-md">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateQuantity(item.cart_id, item.quantity - 1);
                            }}
                            disabled={item.quantity <= 1}
                            className="p-2 border-r hover:bg-gray-100 disabled:opacity-50"
                          >
                            <FaMinus className="w-3 h-3" />
                          </button>
                          <span className="px-4">{item.quantity}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateQuantity(item.cart_id, item.quantity + 1);
                            }}
                            className="p-2 border-l hover:bg-gray-100"
                          >
                            <FaPlus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          NT$ {(item.total_price || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 警告提示 */}
                {(!item.start_date || !item.end_date || !item.spot_name) && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-md">
                    ⚠️ 請點擊商品前往詳細頁完善預訂資訊
                  </div>
                )}
              </div>
            );
          })}

          {/* 總金額和結帳按鈕 */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">總金額</span>
              <span className="text-2xl font-bold text-green-600">
                NT$ {calculateTotal().toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              前往結帳
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 