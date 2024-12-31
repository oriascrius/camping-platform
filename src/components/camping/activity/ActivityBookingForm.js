'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export function ActivityBookingForm({ activity }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    spotId: '',
    quantity: 1,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/camping/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotId: formData.spotId,
          quantity: formData.quantity,
          activityId: activity.activity_id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '預訂失敗');
      }

      toast.success('預訂成功！');
      router.push(`/camping/bookings/${data.bookingId}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedSpot = activity.spots?.find(spot => spot.spot_id === parseInt(formData.spotId));
  const totalAmount = selectedSpot ? selectedSpot.price * formData.quantity : 0;

  if (!activity.spots || activity.spots.length === 0) {
    return (
      <div className="bg-white p-6 rounded-[var(--border-radius-lg)] shadow">
        <p className="text-[var(--gray-4)]">目前沒有可預訂的營位</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-[var(--border-radius-lg)] shadow">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-[var(--gray-1)]">營位預訂</h3>
        
        {/* 營位選擇 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--gray-2)] mb-2">
            選擇營位
          </label>
          <select
            required
            className="w-full border-[var(--gray-6)] rounded-[var(--border-radius-md)] shadow-sm 
                     focus:ring-[var(--primary)] focus:border-[var(--primary)]
                     text-[var(--gray-1)]"
            value={formData.spotId}
            onChange={(e) => setFormData(prev => ({ ...prev, spotId: e.target.value }))}
          >
            <option value="">請選擇營位</option>
            {activity.spots?.map(spot => (
              <option key={spot.spot_id} value={spot.spot_id}>
                {spot.name} - {spot.capacity}人營位 - NT$ {spot.price?.toLocaleString()} 
                (剩餘 {spot.max_quantity} 個名額)
              </option>
            ))}
          </select>
        </div>

        {/* 數量選擇 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--gray-2)] mb-2">
            預訂數量
          </label>
          <select
            required
            className="w-full border-[var(--gray-6)] rounded-[var(--border-radius-md)] shadow-sm 
                     focus:ring-[var(--primary)] focus:border-[var(--primary)]
                     text-[var(--gray-1)]"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
          >
            {[...Array(5)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>

        {/* 總金額顯示 */}
        <div className="mt-6 border-t border-[var(--gray-6)] pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span className="text-[var(--gray-1)]">總金額</span>
            <span className="text-[var(--primary)]">NT$ {totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* 提交按鈕 */}
        <button
          type="submit"
          disabled={loading || !formData.spotId}
          className="w-full mt-6 bg-[var(--primary)] text-white py-2 px-4 
                   rounded-[var(--border-radius-md)] 
                   hover:bg-[var(--secondary-4)] 
                   focus:outline-none focus:ring-2 
                   focus:ring-[var(--primary)] focus:ring-offset-2 
                   disabled:opacity-50 transition-colors"
        >
          {loading ? '處理中...' : '確認預訂'}
        </button>
      </div>
    </form>
  );
} 