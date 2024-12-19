'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCartItems = async () => {
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) throw new Error('獲取購物車失敗');
      const data = await response.json();
      setCartItems(data.cartItems);
    } catch (error) {
      console.error('獲取購物車失敗:', error);
      toast.error('獲取購物車失敗');
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

  const totalAmount = cartItems.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );

  const getImageUrl = (imageName) => {
    console.log('圖片名稱:', imageName);
    
    if (imageName?.startsWith('http')) {
      return imageName;
    }
    
    if (imageName) {
      try {
        return `/uploads/activities/${imageName}`;
      } catch (error) {
        console.error('圖片路徑錯誤:', error);
        return '/default-activity.jpg';
      }
    }
    
    return '/default-activity.jpg';
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
          {cartItems.map(item => {
            console.log('購物車項目:', item);
            return (
              <div 
                key={item.id}
                className="flex items-center gap-6 p-4 bg-white rounded-lg shadow"
              >
                <Image
                  src={getImageUrl(item.main_image)}
                  alt={item.activity_name}
                  width={120}
                  height={80}
                  className="rounded-lg object-cover"
                  onError={(e) => {
                    console.error('圖片載入失敗:', e);
                    e.currentTarget.src = '/default-activity.jpg';
                  }}
                  priority={true}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{item.activity_name}</h3>
                  <p className="text-gray-600">{item.spot_name}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-green-600 font-semibold">
                      NT$ {item.price.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <FaMinus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <FaPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            );
          })}

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center text-xl font-semibold">
              <span>總金額</span>
              <span className="text-green-600">
                NT$ {totalAmount.toLocaleString()}
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