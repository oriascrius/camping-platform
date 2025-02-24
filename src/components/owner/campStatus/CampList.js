'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CampCard from './CampCard';
import CampStatusBadge from './CampStatusBadge';
import Image from 'next/image';
import { HiOutlineSearch, HiViewGrid, HiViewList, HiOutlineClock } from 'react-icons/hi';

export default function CampList() {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/owner/camp-reviews');
        const { data } = await response.json();
        setApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = applications.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B8E7B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜尋和視圖切換 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="搜尋營地名稱或地址..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent"
          />
          <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-[#6B8E7B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <HiViewGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-[#6B8E7B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <HiViewList className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 營地列表 */}
      <AnimatePresence mode="wait">
        {filteredApplications.length > 0 ? (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {filteredApplications.map((application) => (
              <motion.div
                key={application.application_id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {viewMode === 'grid' ? (
                  <CampCard application={application} />
                ) : (
                  <ListItem application={application} />
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-lg shadow-sm"
          >
            <p className="text-gray-500">
              {searchTerm ? '找不到符合的營地' : '目前沒有申請記錄'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 列表項目組件
function ListItem({ application }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 處理圖片 URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/images/camps/default/default.jpg';
    
    // 如果已經是正確的路徑格式
    if (imageUrl.startsWith('/images/camps/') || imageUrl.startsWith('/uploads/')) {
      return imageUrl;
    }
    
    // 如果是完整的 URL
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // 預設返回預設圖片
    return '/images/camps/default/default.jpg';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-center gap-6">
        {/* 圖片 */}
        <div className="relative h-24 w-24 flex-shrink-0">
          <Image
            src={getImageUrl(application.image_url)}
            alt={application.name}
            fill
            className="object-cover rounded-lg"
            sizes="96px"
          />
        </div>

        {/* 內容 */}
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{application.name}</h3>
            <CampStatusBadge status={application.status} />
          </div>
          <p className="text-sm text-gray-500 mb-2">{application.address}</p>
          <div className="flex items-center text-sm text-gray-600">
            <HiOutlineClock className="w-4 h-4 mr-2 text-[#6B8E7B]" />
            <span>申請時間：{formatDate(application.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 