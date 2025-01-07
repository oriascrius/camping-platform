'use client';
import { useState, useEffect } from 'react';
import { HiPlus } from 'react-icons/hi';
import ActivityCard from './ActivityCard';
import ActivityModal from './ActivityModal';
import Swal from 'sweetalert2';

export default function ActivityList() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/owner/activities');
      if (!response.ok) throw new Error('獲取活動失敗');
      const data = await response.json();
      console.log('獲取到的活動數據:', data.activities);
      setActivities(data.activities);
    } catch (error) {
      console.error('獲取活動列表失敗:', error);
      Swal.fire({
        title: '錯誤',
        text: '獲取活動列表失敗',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleDelete = async (activityId) => {
    try {
      const result = await Swal.fire({
        title: '確定要刪除嗎？',
        text: '此操作無法復原',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '確定刪除',
        cancelButtonText: '取消'
      });

      if (result.isConfirmed) {
        const response = await fetch(`/api/owner/activities/${activityId}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('刪除失敗');

        await Swal.fire('成功', '活動已刪除', 'success');
        fetchActivities();
      }
    } catch (error) {
      console.error('刪除活動失敗:', error);
      Swal.fire('錯誤', '刪除失敗', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8E7B]" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#2C4A3B]">活動管理</h1>
        <button
          onClick={() => {
            setSelectedActivity(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-[#6B8E7B] text-white rounded-lg
                     hover:bg-[#5F7A6A] transition-colors duration-200"
        >
          <HiPlus className="w-5 h-5 mr-2" />
          新增活動
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.activity_id}
            activity={activity}
            onEdit={() => handleEdit(activity)}
            onDelete={() => handleDelete(activity.activity_id)}
          />
        ))}
      </div>

      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activity={selectedActivity}
        onSuccess={fetchActivities}
      />
    </div>
  );
} 