'use client';
import { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

export function FavoritesIcon({ onClick }) {
  const { data: session } = useSession();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchFavoritesCount = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/favorites');
      const data = await response.json();
      setFavoritesCount(data.favorites?.length || 0);
    } catch (error) {
      console.error('獲取收藏數量失敗:', error);
    }
  };

  useEffect(() => {
    fetchFavoritesCount();

    const handleFavoritesUpdate = (event) => {
      const { type } = event.detail;
      setFavoritesCount(prev => {
        const newCount = type === 'add' ? prev + 1 : prev - 1;
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
        return newCount;
      });
    };

    window.addEventListener('favoritesUpdate', handleFavoritesUpdate);
    return () => window.removeEventListener('favoritesUpdate', handleFavoritesUpdate);
  }, [session]);

  return (
    <div 
      onClick={onClick}
      className="relative cursor-pointer"
    >
      <FaHeart className="h-6 w-6" />
      {favoritesCount > 0 && (
        <span 
          className={`
            absolute -top-3 -right-3 
            bg-red-500 text-white text-xs 
            rounded-full h-5 w-5 
            flex items-center justify-center
            ${isAnimating ? 'animate-bounce-once' : ''}
          `}
        >
          {favoritesCount}
        </span>
      )}
    </div>
  );
} 