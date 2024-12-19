'use client';
import { Fragment, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { FaShoppingCart, FaHeart, FaRegHeart } from 'react-icons/fa';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSession, signOut } from 'next-auth/react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { CartSidebar } from '../cart/CartSidebar';
import { CartIcon } from '../cart/CartIcon';
import { FavoritesIcon } from '../favorites/FavoritesIcon';
import { FavoritesSidebar } from '../favorites/FavoritesSidebar';

export default function ClientSideNav() {
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { data: session } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/' });
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const handleFavoritesClick = () => {
    setFavoritesOpen(true);
    setIsCartOpen(false);
  };

  const handleCartClick = () => {
    setIsCartOpen(true);
    setFavoritesOpen(false);
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-green-700">
            露營探索家
          </Link>
        </div>
        <div className="hidden md:flex space-x-8">
          <Link href="/" className="text-gray-700 hover:text-green-700">首頁</Link>
          <Link href="/activities" className="text-gray-700 hover:text-green-700">營地搜尋</Link>
          <Link href="/articles" className="text-gray-700 hover:text-green-700">露營攻略</Link>
          <Link href="/community" className="text-gray-700 hover:text-green-700">露營分享</Link>
        </div>
        <div className="flex items-center space-x-4">
          {session?.user ? (
            <>
              <button 
                onClick={handleFavoritesClick}
                className="relative p-2 text-gray-600 hover:text-gray-900"
                aria-label="收藏清單"
              >
                <FavoritesIcon onClick={handleFavoritesClick} />
              </button>
              <button
                onClick={handleCartClick}
                className="relative p-2 text-gray-600 hover:text-gray-900"
                aria-label="購物車"
              >
                <CartIcon onClick={handleCartClick} />
              </button>
              <span className="text-gray-700">歡迎, {session.user?.name}</span>
              <button 
                onClick={handleSignOut}
                className="text-gray-700 hover:text-green-700"
              >
                登出
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="text-gray-700 hover:text-green-700">
              登入/註冊
            </Link>
          )}
        </div>

        <FavoritesSidebar isOpen={favoritesOpen} setIsOpen={setFavoritesOpen} />
        <CartSidebar isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
      </nav>
    </header>
  );
} 