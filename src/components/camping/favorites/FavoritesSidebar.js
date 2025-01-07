'use client';
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { FaHeart } from 'react-icons/fa';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useSession } from 'next-auth/react';

export function FavoritesSidebar({ isOpen, setIsOpen }) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
      const favResponse = await fetch('/api/camping/favorites');
      const favData = await favResponse.json();

      if (!favData.favorites?.length) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const activitiesResponse = await fetch('/api/camping/activities/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityIds: favData.favorites
        })
      });
      const activitiesData = await activitiesResponse.json();
      setFavorites(activitiesData.activities || []);
    } catch (error) {
      console.error('獲取收藏失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFavorites();
    }
  }, [isOpen, session]);

  const handleRemoveFavorite = async (activityId) => {
    try {
      const response = await fetch('/api/camping/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId })
      });

      if (!response.ok) throw new Error('移除收藏失敗');

      setFavorites(prev => prev.filter(fav => fav.activity_id !== activityId));
      window.dispatchEvent(new CustomEvent('favoritesUpdate', { 
        detail: { type: 'remove' } 
      }));
    } catch (error) {
      console.error('移除收藏失敗:', error);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          收藏清單
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={() => setIsOpen(false)}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">關閉面板</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8">
                        {loading ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">載入中...</p>
                          </div>
                        ) : favorites.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">目前沒有收藏的活動</p>
                          </div>
                        ) : (
                          <div className="flow-root">
                            <ul className="-my-6 divide-y divide-gray-200">
                              {favorites.map((activity) => (
                                <li key={activity.activity_id} className="flex py-6">
                                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
                                    <Image
                                      src={`/uploads/activities/${activity.main_image}`}
                                      alt={activity.title}
                                      fill
                                      className="object-cover object-center"
                                      sizes="96px"
                                      priority={true}
                                      onError={(e) => {
                                        e.currentTarget.src = '/default-activity.jpg';
                                      }}
                                    />
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3 className="line-clamp-1">
                                          {activity.title}
                                        </h3>
                                        <button
                                          onClick={() => handleRemoveFavorite(activity.activity_id)}
                                          className="ml-4 text-red-500 hover:text-red-600"
                                        >
                                          <FaHeart className="h-5 w-5" />
                                        </button>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-500">
                                        {format(new Date(activity.start_date), 'yyyy/MM/dd', { locale: zhTW })}
                                        {' - '}
                                        {format(new Date(activity.end_date), 'yyyy/MM/dd', { locale: zhTW })}
                                      </p>
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <p className="text-gray-900">
                                        NT$ {activity.min_price?.toLocaleString()}
                                        {activity.min_price !== activity.max_price && 
                                          ` ~ ${activity.max_price?.toLocaleString()}`
                                        }
                                      </p>
                                      <Link
                                        href={`/camping/activities/${activity.activity_id}`}
                                        onClick={() => setIsOpen(false)}
                                        className="text-green-600 hover:text-green-500"
                                      >
                                        查看詳情
                                      </Link>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                      <div className="mt-6">
                        <Link
                          href="/camping/favorites"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-center rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700"
                        >
                          查看所有收藏
                        </Link>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 