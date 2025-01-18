'use client';
import CampStatusBadge from './CampStatusBadge';
import { HiOutlineClock, HiOutlineLocationMarker, HiOutlineHome } from 'react-icons/hi';

export default function CampCard({ application }) {
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

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        {/* 營地名稱和申請狀態 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <HiOutlineHome className="w-4 h-4 mr-2 text-gray-600" />
            <span className="text-sm font-medium text-gray-800">{application.name}</span>
          </div>
          <CampStatusBadge status={application.status} />
        </div>

        {/* 申請資訊 */}
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <HiOutlineLocationMarker className="w-4 h-4 mr-2" />
            <span>{application.address}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <HiOutlineClock className="w-4 h-4 mr-2" />
            <span>申請時間：{formatDate(application.created_at)}</span>
          </div>

          {application.status_reason && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">狀態說明：</span>
              <p className="mt-1">{application.status_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 