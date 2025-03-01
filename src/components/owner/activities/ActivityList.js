'use client';
import { useState, useEffect } from 'react';
import { HiPlus } from 'react-icons/hi';
import ActivityCard from './ActivityCard';
import ActivityModal from './ActivityModal';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from "framer-motion";

export default function ActivityList() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [expandedStates, setExpandedStates] = useState({});

  useEffect(() => {
    console.log('ActivityList 組件已掛載');
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    console.log('開始獲取活動列表');
    try {
      const response = await fetch('/api/owner/activities');
      console.log('API 回應狀態:', response.status);
      
      if (!response.ok) {
        console.error('API 回應不成功:', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error('獲取活動失敗');
      }

      const data = await response.json();
      console.log('獲取到的活動數據:', {
        messageFromServer: data.message,
        activitiesCount: data.activities.length,
        firstActivity: data.activities[0] || '無活動'
      });

      setActivities(data.activities);
    } catch (error) {
      console.error('獲取活動列表失敗:', {
        message: error.message,
        stack: error.stack
      });
      Swal.fire({
        title: '錯誤',
        text: '獲取活動列表失敗',
        icon: 'error'
      });
    } finally {
      setLoading(false);
      console.log('活動列表載入狀態更新完成');
    }
  };

  const handleEdit = (activity) => {
    console.log('編輯活動:', activity);
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleDelete = async (activityId) => {
    console.log('準備刪除活動:', activityId);
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
        console.log('使用者確認刪除活動:', activityId);
        const response = await fetch(`/api/owner/activities/${activityId}`, {
          method: 'DELETE'
        });

        console.log('刪除請求回應狀態:', response.status);

        if (!response.ok) {
          console.error('刪除請求失敗:', {
            status: response.status,
            statusText: response.statusText
          });
          throw new Error('刪除失敗');
        }

        await Swal.fire('成功', '活動已刪除', 'success');
        console.log('活動刪除成功，重新獲取活動列表');
        fetchActivities();
      } else {
        console.log('使用者取消刪除操作');
      }
    } catch (error) {
      console.error('刪除活動失敗:', {
        message: error.message,
        stack: error.stack
      });
      Swal.fire('錯誤', '刪除失敗', 'error');
    }
  };

  const handleSpotToggle = (activityId) => {
    console.log('切換活動展開狀態:', activityId);
    setExpandedStates(prevStates => {
      const newState = !prevStates[activityId];
      return {
        ...prevStates,
        [activityId]: newState
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8E7B]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 pt-16 bg-[#F5F5F5]"
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="text-2xl font-bold text-[#2C4A3B]"
          >
            活動管理
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedActivity(null);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-[#6B8E7B] text-white rounded-lg
                     hover:bg-[#5F7A6A] transition-colors duration-200
                     shadow-sm hover:shadow-md"
          >
            <HiPlus className="w-5 h-5 mr-2" />
            新增活動
          </motion.button>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {activities.map((activity) => {
            const activityId = activity.activity_id;
            return (
              <ActivityCard
                key={activityId}
                activity={activity}
                onEdit={() => handleEdit(activity)}
                onDelete={() => handleDelete(activityId)}
                isExpanded={!!expandedStates[activityId]}
                onToggleSpot={(e) => {
                  e?.stopPropagation();
                  handleSpotToggle(activityId);
                }}
              />
            );
          })}
        </motion.div>

        <ActivityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          activity={selectedActivity}
          onSuccess={fetchActivities}
        />
      </div>
    </motion.div>
  );
} 