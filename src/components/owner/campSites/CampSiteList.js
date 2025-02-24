'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CampSiteCard from './CampSiteCard';
import { HiOutlineSearch, HiViewGrid, HiViewList, HiOutlinePlusCircle } from 'react-icons/hi';

export default function CampSiteList() {
  const [isLoading, setIsLoading] = useState(true);
  const [campSpots, setCampSpots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const fetchCampSpots = async () => {
      try {
        const response = await fetch('/api/owner/camp-spots');
        const data = await response.json();
        if (data.success) {
          setCampSpots(data.spots || []);
        }
      } catch (error) {
        console.error('Error fetching camp spots:', error);
        setCampSpots([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampSpots();
  }, []);

  const filteredSpots = campSpots.filter(spot => 
    spot && spot.name && spot.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="搜尋營位名稱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent"
          />
          <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>

        <div className="flex items-center gap-4">
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
          
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-[#6B8E7B] text-white rounded-lg hover:bg-[#5F7A6A] transition-colors"
            onClick={() => {/* 處理新增營位 */}}
          >
            <HiOutlinePlusCircle className="w-5 h-5" />
            <span>新增營位</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredSpots.length > 0 ? (
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
            {filteredSpots.map((spot) => (
              <CampSiteCard 
                key={spot.spot_id} 
                campSite={spot}
                viewMode={viewMode}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-lg shadow-sm"
          >
            <p className="text-gray-500">
              {searchTerm ? '找不到符合的營位' : '目前沒有營位記錄'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 