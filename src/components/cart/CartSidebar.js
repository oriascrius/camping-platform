'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaShoppingCart, FaTimes, FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { CartIcon } from './CartIcon';

export function CartSidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart');
      
      console.log('購物車回應狀態:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('購物車回應錯誤:', errorData);
        throw new Error(errorData.error || '獲取購物車失敗');
      }
      
      const data = await response.json();
      console.log('購物車數據:', data);
      console.log('購物車項目詳細信息:', data.cartItems);
      data.cartItems?.forEach(item => {
        console.log('完整項目數據:', item);
        console.log('項目圖片URL:', item.image_url);
        console.log('項目名稱:', item.activity_name);
      });
      
      setCartItems(data.cartItems || []);
      
      // 計算總金額
      const total = (data.cartItems || []).reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      setTotalAmount(total);
      
    } catch (error) {
      console.error('獲取購物車失敗:', error);
      toast.error('獲取購物車失敗');
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
                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <Image
                    src={getImageUrl(item.main_image)}
                    alt={item.activity_name || '活動圖片'}
                    width={80}
                    height={60}
                    className="rounded object-cover"
                    onError={(e) => {
                      console.error('圖片載入失敗:', e);
                      e.currentTarget.src = '/default-activity.jpg';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.activity_name}</h3>
                    <p className="text-sm text-gray-600">{item.spot_name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-green-600 font-semibold">
                        NT$ {item.price.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full hover:bg-gray-200"
                        >
                          <FaMinus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full hover:bg-gray-200"
                        >
                          <FaPlus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="ml-2 text-red-500 hover:text-red-600"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
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
            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              查看購物車
            </Link>
          </div>
        )}
      </div>
    </>
  );
} 