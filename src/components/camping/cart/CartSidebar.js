'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaShoppingCart, FaTimes, FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { CartIcon } from './CartIcon';
import { CalendarIcon, HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export function CartSidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

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
      if (error.message !== '請先登入') {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 監聽購物車更新事件
    const handleCartUpdate = () => {
      fetchCartItems();
    };
    window.addEventListener('cartUpdate', handleCartUpdate);
    
    // 當側邊欄打開時獲購物車內容
    if (isOpen) {
      fetchCartItems();
    }

    return () => {
      window.removeEventListener('cartUpdate', handleCartUpdate);
    };
  }, [isOpen]);

  const handleUpdateQuantity = async (cartId, newQuantity, e) => {
    // 防止事件冒泡，避免關閉側邊欄
    e.stopPropagation();
    
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

      // 觸發購物車更新事件，更新其他組件
      window.dispatchEvent(new Event('cartUpdate'));
      
      toast.success('已更新數量');
    } catch (error) {
      console.error('更新數量失敗:', error);
      toast.error(error.message || '更新失敗，請稍後再試');
    }
  };

  const handleRemoveItem = async (cartId) => {
    console.log('準備刪除的購物車項目ID:', cartId); // 調試用

    if (!cartId) {
      console.log('cartId 不存在:', cartId); // 調試用
      toast.error('無效的操作');
      return;
    }

    try {
      const response = await fetch(`/api/camping/cart`, {  // 修改 API 路徑
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartId }) // 將 cartId 放在請求體中
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '移除項目失敗');
      }

      // 更新本地狀態
      setCartItems(prevItems => {
        console.log('刪除前的項目:', prevItems); // 調試用
        const newItems = prevItems.filter(item => item.id !== cartId);
        console.log('刪除後的項目:', newItems); // 調試用
        return newItems;
      });
      
      toast.success('已購物車移除');
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      console.error('移除購物車項目失敗:', error);
      toast.error(error.message || '移除項目失敗');
    }
  };

  const getImageUrl = (imageName) => {
    if (imageName?.startsWith('http')) {
      return imageName;
    }
    
    if (imageName) {
      const url = `/uploads/activities/${imageName}`;
      return url;
    }
    
    return '/default-activity.jpg';
  };

  const handleViewCart = () => {
    // 直接導向購物車頁面
    router.push('/camping/cart');
    setIsOpen(false); // 關閉側邊欄
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      const price = item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // 檢查項目是否可以計算金額
  const canCalculatePrice = (item) => {
    return item.start_date && item.end_date && item.spot_name;
  };

  // 計算有效的總金額
  const calculateValidTotal = () => {
    return cartItems.reduce((total, item) => {
      if (canCalculatePrice(item)) {
        return total + (item.total_price || 0);
      }
      return total;
    }, 0);
  };

  // 計算天數
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 因為包含起始日
  };

  return (
    <>
      {/* 側邊欄遮罩 */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* 側邊欄內容 */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">購物車</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="h-full overflow-y-auto pb-32">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p>載入中...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32">
              <p className="text-gray-500">購物車是空的</p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {cartItems.map(item => {
                const isItemComplete = canCalculatePrice(item);
                const uniqueKey = `cart-item-${item.id}-${Date.now()}`;
                const days = calculateDays(item.start_date, item.end_date);

                return (
                  <div key={uniqueKey} className="relative bg-gray-50 rounded-lg p-4">
                    {/* 刪除按鈕 */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>

                    {/* 商品內容 */}
                    <div className="flex gap-4">
                      {/* 商品圖片 */}
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          src={getImageUrl(item.main_image)}
                          alt={item.title || '活動圖片'}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* 商品資訊 */}
                      <div className="flex-1">
                        {/* 標題 */}
                        <h3 className="font-semibold text-base">
                          {item.title}
                        </h3>
                        
                        {/* 日期和營位資訊 */}
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            {item.start_date && item.end_date ? (
                              <span className="text-gray-600">
                                {format(new Date(item.start_date), 'yyyy/MM/dd')} - 
                                {format(new Date(item.end_date), 'yyyy/MM/dd')}
                                <span className="ml-1 text-gray-500">
                                  (共 {days} 天)
                                </span>
                              </span>
                            ) : (
                              <span className="text-amber-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                尚未選擇日期
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <HomeIcon className="h-4 w-4 text-gray-400" />
                            {item.spot_name ? (
                              <span className="text-gray-600">{item.spot_name}</span>
                            ) : (
                              <span className="text-amber-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                尚未選擇營位
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 數量和價格 - 獨立的一行 */}
                    <div className="mt-4 flex items-center justify-between w-full">
                      {/* 數量控制 */}
                      <div className={`flex items-center border rounded-md ${!isItemComplete ? 'opacity-50' : ''}`}>
                        <button
                          onClick={(e) => handleUpdateQuantity(item.id, item.quantity - 1, e)}
                          disabled={!isItemComplete || item.quantity <= 1}
                          className="p-1 px-2 border-r hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaMinus className="w-3 h-3" />
                        </button>
                        <span className="px-3">{item.quantity}</span>
                        <button
                          onClick={(e) => handleUpdateQuantity(item.id, item.quantity + 1, e)}
                          disabled={!isItemComplete}
                          className="p-1 px-2 border-l hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaPlus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {/* 價格顯示 */}
                      <div className="flex items-center">
                        {isItemComplete ? (
                          <div className="text-green-600 font-semibold">
                            NT$ {Number(item.total_price).toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-amber-500 text-sm flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            請完善預訂資訊
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部總金額和按鈕 */}
        {cartItems.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">總金額</span>
              <div className="text-right">
                {calculateValidTotal() > 0 ? (
                  <span className="text-xl font-bold text-green-600">
                    NT$ {calculateValidTotal().toLocaleString()}
                  </span>
                ) : (
                  <span className="text-amber-500">
                    請完善預訂資訊以顯示總額
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleViewCart}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              查看購物車
            </button>
          </div>
        )}
      </div>
    </>
  );
} 