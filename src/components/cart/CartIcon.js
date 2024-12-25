'use client';
import { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

export function CartIcon({ onClick }) {
  const { data: session, status } = useSession();
  const [itemCount, setItemCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchCartCount = async () => {
    try {
      if (status === 'loading') return;
      
      if (!session) {
        setItemCount(0);
        return;
      }

      const response = await fetch('/api/camping/cart');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '獲取購物車失敗');
      }
      
      const data = await response.json();
      setItemCount(data.cartItems?.length || 0);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('獲取購物車數量失敗:', error);
      }
      setItemCount(0);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      fetchCartCount();
    }

    const handleCartUpdate = () => {
      fetchCartCount();
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    };

    window.addEventListener('cartUpdate', handleCartUpdate);
    return () => window.removeEventListener('cartUpdate', handleCartUpdate);
  }, [session, status]);

  // 只返回圖標和數字，不包含按鈕
  return (
    <div className="relative">
      <FaShoppingCart className="w-6 h-6 text-gray-600" />
      {itemCount > 0 && (
        <span 
          className={`absolute -top-3 -right-3 bg-red-500 text-white text-xs 
            rounded-full w-5 h-5 flex items-center justify-center
            ${isAnimating ? 'animate-bounce-once' : ''}`}
        >
          {itemCount}
        </span>
      )}
    </div>
  );
} 