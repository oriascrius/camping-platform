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
      const response = await fetch('/api/cart');
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
      console.error('更新購物車數量失敗:', error);
      toast.error('更新數量失敗');
    }
  };

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
      toast.success('已從購物車移除');
    } catch (error) {
      console.error('移除購物車項目失敗:', error);
      toast.error('移除項目失敗');
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
    router.push('/cart');
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
              {cartItems.map(item => (
                <div key={item.cart_id || `temp-${Math.random()}`} className="flex flex-col p-4 bg-gray-50 rounded-lg">
                  {/* 商品圖片和基本資訊 */}
                  <div 
                    className="flex gap-4 cursor-pointer"
                    onClick={() => {
                      router.push(`/activities/${item.activity_id}`);
                      setIsOpen(false);
                    }}
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src={getImageUrl(item.main_image)}
                        alt={item.title || '活動圖片'}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('圖片載入失敗:', e);
                          e.currentTarget.src = '/default-activity.jpg';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold hover:text-green-600">
                        {item.title || '未命名活動'}
                      </h3>
                      <p className="text-sm text-gray-500">{item.subtitle || ''}</p>
                      
                      {/* 日期和營位資訊 */}
                      <div className="mt-2 space-y-1">
                        {/* 日期資訊 */}
                        <div className="flex items-center gap-1 text-sm">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {item.spot_name && item.start_date && item.end_date ? (
                            <span className="text-gray-600">
                              {format(new Date(item.start_date), 'yyyy/MM/dd')} - 
                              {format(new Date(item.end_date), 'yyyy/MM/dd')}
                            </span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-3 w-3" />
                              尚未選擇日期
                            </span>
                          )}
                        </div>

                        {/* 營位資訊 */}
                        <div className="flex items-center gap-1 text-sm">
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

                      {/* 數量和價格 */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border rounded-md">
                            <button
                              onClick={() => handleUpdateQuantity(item.cart_id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="p-1 px-2 border-r hover:bg-gray-200 disabled:opacity-50"
                            >
                              <FaMinus className="w-3 h-3" />
                            </button>
                            <span className="px-3">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.cart_id, item.quantity + 1)}
                              className="p-1 px-2 border-l hover:bg-gray-200"
                            >
                              <FaPlus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.cart_id)}
                            className="ml-2 text-red-500 hover:text-red-600"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-600">
                            NT$ {((item.price || 0) * item.quantity).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            NT$ {(item.price || 0).toLocaleString()} / 組
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 警告提示 */}
                  {(!item.start_date || !item.end_date || !item.spot_name) && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-md text-xs">
                      ⚠️ 請至商品詳細頁完善預訂資訊
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">總金額</span>
              <span className="text-xl font-bold text-green-600">
                NT$ {totalAmount.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleViewCart}
              className="block w-full text-center py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              看購物車
            </button>
          </div>
        )}
      </div>
    </>
  );
} 