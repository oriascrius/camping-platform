'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { CalendarIcon, HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 獲取購物車內容
  const fetchCartItems = async () => {
    try {
      const response = await fetch('/api/camping/cart');
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
    if (!cartId || newQuantity < 1) {
      toast.error('無效的操作');
      return;
    }
    
    try {
      const response = await fetch(`/api/camping/cart/${cartId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '更新數量失敗');
      }

      const data = await response.json();
      
      // 更新本地狀態
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === cartId 
            ? { ...item, quantity: newQuantity, total_price: data.total_price }
            : item
        )
      );

      toast.success('已更新數量');
    } catch (error) {
      console.error('更新數量失敗:', error);
      toast.error(error.message || '更新失敗，請稍後再試');
    }
  };

  // 修改刪除函數
  const handleRemoveItem = async (cartId) => {
    if (!cartId) {
      toast.error('無效的購物車項目');
      return;
    }

    try {
      const response = await fetch(`/api/camping/cart/${cartId}`, {
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

  // 檢查項目是否可以更新數量
  const canUpdateQuantity = (item) => {
    return item.start_date && item.end_date && item.spot_name;
  };

  // 檢查項目是否可以計算金額
  const canCalculatePrice = (item) => {
    return item.start_date && item.end_date && item.spot_name;
  };

  // 計算有效的總金額（只計算已完善資訊的項目）
  const calculateValidTotal = () => {
    return cartItems.reduce((total, item) => {
      if (canCalculatePrice(item)) {
        return total + (item.total_price || 0);
      }
      return total;
    }, 0);
  };

  // 檢查是否有未完善的項目
  const hasIncompleteItems = () => {
    return cartItems.some(item => !canCalculatePrice(item));
  };

  // 計算天數
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 因為包含起始日
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
            const imageUrl = item.main_image
              ? `/uploads/activities/${item.main_image}`
              : '/images/default-activity.jpg';

            const isItemComplete = canCalculatePrice(item);
            const days = calculateDays(item.start_date, item.end_date);

            return (
              <div key={item.id} className="relative bg-white p-4 rounded-lg shadow">
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
                  onClick={() => router.push(`/camping/activities/${item.activity_id}`)}
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
                          <span className="text-gray-600">
                            {format(new Date(item.start_date), 'yyyy/MM/dd')} - 
                            {format(new Date(item.end_date), 'yyyy/MM/dd')}
                            <span className="ml-1 text-gray-500">
                              (共 {days} 天)
                            </span>
                          </span>
                        ) : (
                          <Link 
                            href={`/activities/${item.activity_id}`}
                            className="text-amber-500 flex items-center gap-1 hover:text-amber-600"
                          >
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            請選擇日期
                          </Link>
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
                        <div className={`flex items-center border rounded-md ${!isItemComplete ? 'opacity-50' : ''}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isItemComplete) {
                                handleUpdateQuantity(item.id, item.quantity - 1);
                              } else {
                                toast.warning('請先選擇日期和營位');
                              }
                            }}
                            disabled={!isItemComplete || item.quantity <= 1}
                            className="p-2 border-r hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaMinus className="w-3 h-3" />
                          </button>
                          <span className="px-4">{item.quantity}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isItemComplete) {
                                handleUpdateQuantity(item.id, item.quantity + 1);
                              } else {
                                toast.warning('請先選擇日期和營位');
                              }
                            }}
                            disabled={!isItemComplete}
                            className="p-2 border-l hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaPlus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* 價格顯示區塊 */}
                      <div className="text-right">
                        {isItemComplete ? (
                          <div className="text-xl font-bold text-green-600">
                            NT$ {(item.total_price || 0).toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-amber-500 text-sm flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            <span>請先完善預訂資訊</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 警告提示 */}
                    {!isItemComplete && (
                      <div className="mt-2 text-xs text-amber-500">
                        * 完善預訂資訊後將顯示實際金額
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 總金額區塊 */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <div className="space-y-4">
              {hasIncompleteItems() && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-md flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <div>
                    <p className="font-medium">部分商品尚未完善預訂資訊</p>
                    <p className="text-sm mt-1">請點擊商品前往完善，以顯示實際金額</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold">總金額</span>
                <div className="text-right">
                  {calculateValidTotal() > 0 ? (
                    <>
                      <span className="text-2xl font-bold text-green-600">
                        NT$ {calculateValidTotal().toLocaleString()}
                      </span>
                      {hasIncompleteItems() && (
                        <div className="text-sm text-amber-500 mt-1">
                          * 未包含未完善資訊商品的金額
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-lg text-amber-500">
                      請完善預訂資訊以顯示金額
                    </span>
                  )}
                </div>
              </div>

              {/* 結帳按鈕 */}
              <button
                onClick={() => {
                  if (hasIncompleteItems()) {
                    toast.warning('請先完善所有商品的預訂資訊');
                    return;
                  }
                  router.push('/camping/checkout');
                }}
                className={`w-full py-3 text-white rounded-lg ${
                  hasIncompleteItems() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={hasIncompleteItems()}
              >
                {hasIncompleteItems() ? '請先完善預訂資訊' : '前往結帳'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 