'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaTimes, FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { CalendarIcon, HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { showCartAlert } from "@/utils/sweetalert";  // 引入購物車專用的 sweetalert 工具
import { useDebounce } from '@/hooks/useDebounce';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaCampground } from 'react-icons/fa'; // 引入營地圖標

export function CartSidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 防抖處理購物車數據獲取
  const debouncedFetchCartItems = useDebounce(async () => {
    // 如果側邊欄沒有打開，不需要獲取數據
    if (!isOpen) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/camping/cart');
      
      // 處理未登入狀態
      if (response.status === 401) {
        // 儲存當前完整路徑（包含查詢參數）
        const currentPath = window.location.pathname + window.location.search;
        
        // 使用統一的 sweetalert 工具
        const result = await showCartAlert.confirm('請先登入', '登入後即可查看購物車內容');

        // 關閉購物車側邊欄
        setIsOpen(false);

        if (result.isConfirmed) {
          // 如果用戶選擇登入，直接導向登入頁面
          // 不需要在 URL 中加入 callbackUrl
          router.push('/auth/login');
          // 將當前路徑儲存到 localStorage
          localStorage.setItem('redirectAfterLogin', currentPath);
        } else {
          // 確保側邊欄已關閉
          setIsOpen(false);
        }
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '獲取購物車失敗');
      }
      
      const data = await response.json();
      setCartItems(data.cartItems || []);
    } catch (error) {
      if (error.message !== '請先登入') {
        await showCartAlert.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, 300);

  // 修改 useEffect，只在 isOpen 變為 true 時獲取數據
  useEffect(() => {
    if (isOpen) {
      debouncedFetchCartItems();
    }
  }, [isOpen]); // 只監聽 isOpen 的變化

  // 分開處理 cartUpdate 事件
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isOpen) {  // 只在側邊欄打開時更新數據
        debouncedFetchCartItems();
      }
    };

    window.addEventListener('cartUpdate', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdate', handleCartUpdate);
    };
  }, [isOpen]); // 只依賴 isOpen

  // 防抖處理數量更新
  const debouncedUpdateQuantity = useDebounce(async (cartId, newQuantity) => {
    if (!cartId || newQuantity < 1) {
      await showCartAlert.error('無效的操作');
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
      
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === cartId 
            ? { ...item, quantity: newQuantity, total_price: data.total_price }
            : item
        )
      );

      window.dispatchEvent(new Event('cartUpdate'));
      await showCartAlert.success('已更新數量');
    } catch (error) {
      await showCartAlert.error(error.message || '更新失敗，請稍後再試');
    }
  }, 300);

  const handleUpdateQuantity = async (cartId, newQuantity, e) => {
    e.stopPropagation();
    debouncedUpdateQuantity(cartId, newQuantity);
  };

  const handleRemoveItem = async (cartId) => {
    if (!cartId) {
      await showCartAlert.error('無效的操作');
      return;
    }

    try {
      const result = await showCartAlert.confirm(
        '確定要移除此項目？',
        '移除後將無法復原'
      );

      if (!result.isConfirmed) {
        return;
      }

      const response = await fetch(`/api/camping/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '移除項目失敗');
      }

      setCartItems(prevItems => prevItems.filter(item => item.id !== cartId));
      await showCartAlert.success('商品已從購物車中移除');
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      await showCartAlert.error(error.message || '移除項目失敗，請稍後再試');
    }
  };

  const getImageUrl = (imageName) => {
    if (imageName?.startsWith('http')) {
      return imageName;
    }
    return imageName ? `/uploads/activities/${imageName}` : '/default-activity.jpg';
  };

  const handleViewCart = async () => {
    const hasIncompleteItems = cartItems.some(item => !canCalculatePrice(item));
    // hasIncompleteItems 是用來檢查購物車中是否有未完整填寫資訊的項目
    if (hasIncompleteItems) {
      const result = await showCartAlert.confirm(
        '尚有未完成的預訂資訊',
        '建議先完善所有預訂資訊再進行結帳'
      );

      if (result.isConfirmed) {
        router.push(`/camping/activities/${cartItems[0].activity_id}`);  // 如果確認，直接前往購物車頁面
        setIsOpen(false);
      }
      return;

    }

    router.push('/camping/cart');
    setIsOpen(false);
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

  const canCalculatePrice = (item) => {
    return item.start_date && item.end_date && item.spot_name;
  };

  const calculateValidTotal = () => {
    return cartItems.reduce((total, item) => {
      if (canCalculatePrice(item)) {
        return total + (item.total_price || 0);
      }
      return total;
    }, 0);
  };

  const calculateNights = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 移除 +1，直接計算晚數
    return nights;
  };

  return (
    <>
      {/* 購物車遮罩層和側邊欄 - 保持較高的 z-index */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-[2001] transition-opacity duration-300
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* 購物車側邊欄 */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-[2002] transform transition-transform duration-300
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
            <div className="flex flex-col items-center justify-center h-[70vh] p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <FaCampground className="w-16 h-16 text-[#6B8E7B] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  購物車是空的
                </h3>
                <p className="text-gray-500 mb-6">
                  來看看我們精選的露營地點吧！
                </p>
                
                <Link href="/camping/activities">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#6B8E7B] text-white px-8 py-3 rounded-xl
                             hover:bg-[#5F7A68] transition-colors duration-300
                             flex items-center justify-center mx-auto gap-2
                             shadow-md hover:shadow-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaCampground className="w-5 h-5" />
                    <span>立即預訂營地</span>
                  </motion.button>
                </Link>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 p-4 bg-gray-50 rounded-lg"
                >
                  <p className="text-sm text-gray-600">
                    💡 提示：預訂營地後可以在這裡查看訂單詳情
                  </p>
                </motion.div>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-4 pt-0 p-4">
              {cartItems.map(item => {
                const isItemComplete = canCalculatePrice(item);
                const uniqueKey = `cart-item-${item.id}-${Date.now()}`;
                const nights = calculateNights(item.start_date, item.end_date);

                return (
                  <div key={uniqueKey} className="relative bg-gray-50 rounded-lg p-4">
                    {/* 刪除按鈕 */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>

                    {/* 添加可點擊的包裝層 */}
                    <div 
                      onClick={() => {
                        router.push(`/camping/activities/${item.activity_id}`);
                        setIsOpen(false);
                      }}
                      className="cursor-pointer hover:bg-gray-100 transition-colors rounded-lg"
                    >
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
                                    (共 {calculateNights(item.start_date, item.end_date)} 晚)
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
                    </div>

                    {/* 價格顯示區域 */}
                    <div className="mt-4 flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
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
                      
                      {/* 價格詳細資訊 */}
                      <div className="flex flex-col items-end">
                        {isItemComplete ? (
                          <>
                            <div className="text-sm text-gray-500">
                              NT$ {Number(item.unit_price).toLocaleString()} × 
                              {calculateNights(item.start_date, item.end_date)} 晚 × 
                              {item.quantity} 營位
                            </div>
                            <div className="text-green-600 font-semibold mt-1">
                              NT$ {Number(item.total_price).toLocaleString()}
                            </div>
                          </>
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
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
          {cartItems.length > 0 ? (
            <>
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
                className="w-full py-3 bg-[var(--primary-brown)] text-white rounded-lg hover:bg-[var(--secondary-brown)] transition-colors"
              >
                查看購物車
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/camping/cart');
              }}
              className="w-full py-3 bg-[var(--primary-brown)] text-white rounded-lg hover:bg-[var(--secondary-brown)] transition-colors"
            >
            查看詳細資訊
            </button>
          )}
        </div>
      </div>
    </>
  );
} 