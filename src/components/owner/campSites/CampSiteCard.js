'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { HiOutlineUsers, HiOutlineCash, HiOutlineStatusOnline } from 'react-icons/hi';

export default function CampSiteCard({ campSite, viewMode }) {
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/images/camps/default/default.jpg';
    if (imageUrl.startsWith('/images/') || imageUrl.startsWith('/uploads/')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return '/images/camps/default/default.jpg';
  };

  const statusColors = {
    0: 'text-red-500',
    1: 'text-green-500'
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 flex-shrink-0">
            <Image
              src={getImageUrl(campSite.image_url)}
              alt={campSite.name}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 96px, 96px"
              priority={false}
            />
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{campSite.name}</h3>
              <span className={`text-sm ${statusColors[campSite.status]}`}>
                {campSite.status === 1 ? '啟用中' : '已停用'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <HiOutlineUsers className="w-4 h-4 mr-2 text-[#6B8E7B]" />
                <span>可容納 {campSite.capacity} 人</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiOutlineCash className="w-4 h-4 mr-2 text-[#6B8E7B]" />
                <span>NT$ {campSite.price} / 晚</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm text-[#6B8E7B] border border-[#6B8E7B] rounded hover:bg-[#6B8E7B] hover:text-white transition-colors">
              編輯
            </button>
            <button className="px-3 py-1 text-sm text-red-500 border border-red-500 rounded hover:bg-red-500 hover:text-white transition-colors">
              {campSite.status === 1 ? '停用' : '啟用'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="relative h-48 w-full">
        <Image
          src={getImageUrl(campSite.image_url)}
          alt={campSite.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-sm rounded-full bg-white ${statusColors[campSite.status]}`}>
            {campSite.status === 1 ? '啟用中' : '已停用'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{campSite.name}</h3>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <HiOutlineUsers className="w-4 h-4 mr-2 text-[#6B8E7B]" />
            <span>可容納 {campSite.capacity} 人</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <HiOutlineCash className="w-4 h-4 mr-2 text-[#6B8E7B]" />
            <span>NT$ {campSite.price} / 晚</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 py-2 text-sm text-[#6B8E7B] border border-[#6B8E7B] rounded hover:bg-[#6B8E7B] hover:text-white transition-colors">
            編輯
          </button>
          <button className="flex-1 py-2 text-sm text-red-500 border border-red-500 rounded hover:bg-red-500 hover:text-white transition-colors">
            {campSite.status === 1 ? '停用' : '啟用'}
          </button>
        </div>
      </div>
    </motion.div>
  );
} 