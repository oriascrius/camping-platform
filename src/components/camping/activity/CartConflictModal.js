'use client';
import { format } from 'date-fns';

export default function CartConflictModal({
  open,
  existingItem,
  newOption,
  newQuantity,
  newStartDate,
  newEndDate,
  calculateTotalPrice,
  onConfirm,
  onCancel
}) {
  if (!open || !existingItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-[500px] w-full mx-4">
        <h3 className="text-xl font-medium text-[#4A3C31] mb-4">
          購物車已有相同活動
        </h3>
        
        <div className="py-4">
          <p className="mb-4">您的購物車中已有此活動：</p>
          <div className="bg-[#F5F2EA] p-4 rounded-lg mb-4">
            <p className="font-medium text-[#4A3C31]">現有預訂：</p>
            <ul className="text-[#7C6C55] mt-2 space-y-2">
              <li>• 營位：{existingItem.spot_name}</li>
              <li>• 數量：{existingItem.quantity} 個</li>
              <li>• 日期：{format(new Date(existingItem.start_date), 'yyyy/MM/dd')} - {format(new Date(existingItem.end_date), 'yyyy/MM/dd')}</li>
              <li>• 金額：NT$ {existingItem.total_price?.toLocaleString()}</li>
            </ul>
          </div>
          <div className="bg-[#F7F9F8] p-4 rounded-lg mb-4">
            <p className="font-medium text-[#4A3C31]">新的選擇：</p>
            <ul className="text-[#7C6C55] mt-2 space-y-2">
              <li>• 營位：{newOption?.spot_name}</li>
              <li>• 數量：{newQuantity} 個</li>
              <li>• 日期：{format(new Date(newStartDate), 'yyyy/MM/dd')} - {format(new Date(newEndDate), 'yyyy/MM/dd')}</li>
              <li>• 金額：NT$ {calculateTotalPrice().toLocaleString()}</li>
            </ul>
          </div>
          <p className="text-[#7C6C55]">是否要更新為新選擇的內容？</p>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[#8B7355] text-[#8B7355] rounded-lg hover:bg-[#8B7355] hover:text-white transition-colors"
          >
            保持原有預訂
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B5335] transition-colors"
          >
            更新預訂
          </button>
        </div>
      </div>
    </div>
  );
} 