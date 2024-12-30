'use client';
import { useState, useEffect } from 'react';
import { ActivityList } from '@/components/camping/activity/ActivityList';
import { ActivitySearch } from '@/components/camping/activity/ActivitySearch';
import { ActivitySidebar } from '@/components/camping/activity/ActivitySidebar';

export default function ActivitiesPage({ searchParams }) {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);

  // 初始載入活動列表
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/camping/activities');
        const data = await response.json();
        setActivities(data.activities);
        setFilteredActivities(data.activities);
      } catch (error) {
        console.error('獲取活動列表失敗:', error);
      }
    };

    fetchActivities();
  }, []);

  // 處理地區篩選
  const handleLocationFilter = (location) => {
    if (location === 'all') {
      setFilteredActivities(activities);
    } else {
      const filtered = activities.filter(activity => {
        const locationPrefix = location.substring(0, 2);
        return activity.camp_address?.includes(locationPrefix) || 
               activity.camp_address?.includes(location);
      });
      setFilteredActivities(filtered);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">露營活動</h1>
        <ActivitySearch initialFilters={searchParams} />
      </div>
      <div className="flex gap-6">
        <div className="hidden lg:block">
          <ActivitySidebar onFilterChange={handleLocationFilter} />
        </div>
        <div className="flex-1">
          <ActivityList activities={filteredActivities} />
        </div>
      </div>
    </div>
  );
} 