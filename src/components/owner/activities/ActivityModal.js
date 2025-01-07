'use client';
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { HiX } from 'react-icons/hi';
import Swal from 'sweetalert2';
import Image from 'next/image';

export default function ActivityModal({ isOpen, onClose, activity, onSuccess }) {
  const [formData, setFormData] = useState({
    activity_name: '',
    description: '',
    start_date: '',
    end_date: '',
    image_url: '',
    is_active: true,
    options: []
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_name: activity.activity_name || '',
        description: activity.description || '',
        start_date: activity.start_date?.split('T')[0] || '',
        end_date: activity.end_date?.split('T')[0] || '',
        image_url: activity.image_url || '',
        is_active: activity.is_active ?? true,
        options: activity.options || [],
        main_image: activity.main_image || ''
      });
    } else {
      setFormData({
        activity_name: '',
        description: '',
        start_date: '',
        end_date: '',
        image_url: '',
        is_active: true,
        options: []
      });
    }
  }, [activity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = activity 
        ? `/api/owner/activities/${activity.activity_id}`
        : '/api/owner/activities';
      
      const response = await fetch(url, {
        method: activity ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('儲存失敗');

      await Swal.fire({
        icon: 'success',
        title: '成功',
        text: `活動${activity ? '更新' : '新增'}成功！`,
        timer: 1500,
        showConfirmButton: false
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('提交表單時發生錯誤:', error);
      Swal.fire('錯誤', '儲存失敗', 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/owner/activities/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('圖片上傳失敗');

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        main_image: data.filename
      }));
    } catch (error) {
      console.error('圖片上傳失敗:', error);
      Swal.fire('錯誤', '圖片上傳失敗', 'error');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <Dialog.Title className="text-xl font-bold text-[#2C4A3B]">
              {activity ? '編輯活動' : '新增活動'}
            </Dialog.Title>
            <button onClick={onClose}>
              <HiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  活動名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.activity_name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    activity_name: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  活動圖片 <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    {formData.main_image ? (
                      <Image
                        src={`/uploads/activities/${formData.main_image}`}
                        alt="活動圖片"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400">無圖片</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#E3D5CA] file:text-[#7D6D61]
                      hover:file:bg-[#D5C3B8]"
                  />
                </div>
              </div>

              {/* 其他表單欄位... */}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#6B8E7B] text-white rounded-lg hover:bg-[#5F7A6A]"
              >
                確認
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 