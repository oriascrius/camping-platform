'use client';
import { format } from 'date-fns';
import { showCartAlert } from '@/utils/sweetalert';

export default function CartConflictModal({
  open,
  existingItem,
  newOption,
  newQuantity,
  newStartDate,
  newEndDate,
  calculateTotalPrice,
  onConfirm,
  onCancel,
  onUpdate
}) {
  if (!open || !existingItem) return null;

  const handleConfirm = async () => {
    try {
      // 檢查所有必要數據
      if (!existingItem?.id || !newOption?.option_id) {
        console.error('缺少必要資料:', {
          cartId: existingItem?.id,
          optionId: newOption?.option_id
        });
        throw new Error('缺少必要資料');
      }

      const updateData = {
        quantity: newQuantity,
        startDate: newStartDate,
        endDate: newEndDate,
        optionId: newOption.option_id,
        totalPrice: calculateTotalPrice()
      };

      console.log('準備發送更新請求:', {
        cartId: existingItem.id,
        updateData
      });

      const response = await fetch(`/api/camping/cart/${existingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const responseData = await response.json();
      console.log('收到伺服器回應:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || '更新購物車失敗');
      }

      // 成功後直接關閉 modal
      onCancel();
      
      // 使用 showCartAlert.success 顯示成功訊息
      await showCartAlert.success('購物車已更新', '商品數量已成功更新');

      // 調用父組件的更新函數，而不是重新整理頁面
      if (onUpdate) {
        onUpdate();
      }

    } catch (error) {
      console.error('更新購物車時發生錯誤:', error);
      // 使用 showCartAlert.error 顯示錯誤訊息
      await showCartAlert.error('更新失敗', error.message || '更新購物車時發生錯誤，請稍後再試');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-[95%] max-w-[500px] mx-auto">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-medium text-[#4A3C31] mb-4">
            購物車已有相同活動
          </h3>
          
          <div className="py-3 sm:py-4">
            <p className="text-sm sm:text-base mb-4">您的購物車中已有此活動：</p>
            
            <div className="bg-[#F5F2EA] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
              <p className="font-medium text-[#4A3C31] text-sm sm:text-base">現有預訂：</p>
              <ul className="text-[#7C6C55] mt-2 space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                <li className="flex items-start break-all">
                  <span className="flex-shrink-0 mr-2">•</span>
                  <span className="flex-1">營位：{existingItem.spot_name}</span>
                </li>
                <li className="flex items-start break-all">
                  <span className="flex-shrink-0 mr-2">•</span>
                  <span className="flex-1">數量：{existingItem.quantity} 個</span>
                </li>
                <li className="flex items-start break-all">
                  <span className="flex-shrink-0 mr-2">•</span>
                  <span className="flex-1">
                    日期：{format(new Date(existingItem.start_date), 'yyyy/MM/dd')} - 
                    {format(new Date(existingItem.end_date), 'yyyy/MM/dd')}
                  </span>
                </li>
                <li className="flex items-start break-all">
                  <span className="flex-shrink-0 mr-2">•</span>
                  <span className="flex-1">金額：NT$ {existingItem.total_price?.toLocaleString()}</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-[#F7F9F8] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
              <p className="font-medium text-[#4A3C31] text-sm sm:text-base">新的選擇：</p>
              <ul className="text-[#7C6C55] mt-2 space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                <li className="flex items-start break-all">
                  <span className="flex-shrink-0 mr-2">•</span>
                  <span className="flex-1">營位：{newOption?.spot_name}</span>
                </li>
                <li className="flex items-start break-all">
                  <span className="flex-shrink-0 mr-2">•</span>
                  <span className="flex-1">數量：{newQuantity} 個</span>
                </li>
                <li className="flex items-start break-all">
                  <span className="flex-shrink-0 mr-2">•</span>
                  <span className="flex-1">
                    日期：{format(new Date(newStartDate), 'yyyy/MM/dd')} - 
                    {format(new Date(newEndDate), 'yyyy/MM/dd')}
                  </span>
                </li>
                <li className="flex items-start break-all">
                  <span className="flex-shrink-0 mr-2">•</span>
                  <span className="flex-1">金額：NT$ {calculateTotalPrice().toLocaleString()}</span>
                </li>
              </ul>
            </div>
            
            <p className="text-[#7C6C55] text-sm sm:text-base">是否要更新為新選擇的內容？</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 mt-4 sm:mt-6">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2 border border-[#8B7355] text-[#8B7355] rounded-lg 
                hover:bg-[#8B7355] hover:text-white transition-colors text-sm sm:text-base"
            >
              保持原有預訂
            </button>
            <button
              onClick={handleConfirm}
              className="w-full sm:w-auto px-4 py-2 bg-[#8B7355] text-white rounded-lg 
                hover:bg-[#6B5335] transition-colors text-sm sm:text-base"
            >
              更新預訂
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 