'use client';
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { HiX } from 'react-icons/hi';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";

export default function ActivityModal({ isOpen, onClose, activity, onSuccess }) {
  const [formData, setFormData] = useState({
    activity_name: '',
    title: '',
    subtitle: '',
    description: '',
    notice: '',
    start_date: '',
    end_date: '',
    main_image: '',
    is_active: true,
    city: '',
    is_featured: false,
    application_id: '',
    options: []
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_name: activity.activity_name || '',
        title: activity.title || '',
        subtitle: activity.subtitle || '',
        description: activity.description || '',
        notice: activity.notice || '',
        start_date: activity.start_date?.split('T')[0] || '',
        end_date: activity.end_date?.split('T')[0] || '',
        main_image: activity.main_image || '',
        is_active: activity.is_active ?? true,
        city: activity.city || '',
        is_featured: activity.is_featured ?? false,
        application_id: activity.application_id || '',
        options: activity.options || []
      });
    } else {
      setFormData({
        activity_name: '',
        title: '',
        subtitle: '',
        description: '',
        notice: '',
        start_date: '',
        end_date: '',
        main_image: '',
        is_active: true,
        city: '',
        is_featured: false,
        application_id: '',
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
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30"
              aria-hidden="true"
            />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-4xl bg-white rounded-xl shadow-xl"
                style={{ height: 'calc(100vh - 120px)' }}
              >
                <div className="flex flex-col h-full">
                  <div className="shrink-0 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#2C4A3B]">
                      {activity ? '編輯活動' : '新增活動'}
                    </h2>
                    <button onClick={onClose}>
                      <HiX className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex-1 overflow-auto px-6 py-4">
                      <div className="flex gap-6">
                        <div className="flex-1 space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-[#2C4A3B]">基本資訊</h3>
                            
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
                                標題
                              </label>
                              <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  title: e.target.value
                                }))}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                副標題
                              </label>
                              <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  subtitle: e.target.value
                                }))}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-[#2C4A3B]">時間與地點</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  開始日期 <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  value={formData.start_date}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    start_date: e.target.value
                                  }))}
                                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  結束日期 <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  value={formData.end_date}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    end_date: e.target.value
                                  }))}
                                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                縣市
                              </label>
                              <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  city: e.target.value
                                }))}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-[#2C4A3B]">活動內容</h3>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                活動說明
                              </label>
                              <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  description: e.target.value
                                }))}
                                rows={4}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                注意事項
                              </label>
                              <textarea
                                value={formData.notice}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  notice: e.target.value
                                }))}
                                rows={4}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-[#2C4A3B]">活動圖片</h3>
                            
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

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-[#2C4A3B]">狀態設定</h3>
                            
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.is_active}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    is_active: e.target.checked
                                  }))}
                                  className="rounded border-gray-300 text-[#6B8E7B] focus:ring-[#6B8E7B]"
                                />
                                <span className="ml-2 text-sm text-gray-700">可報名</span>
                              </label>

                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.is_featured}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    is_featured: e.target.checked
                                  }))}
                                  className="rounded border-gray-300 text-[#6B8E7B] focus:ring-[#6B8E7B]"
                                />
                                <span className="ml-2 text-sm text-gray-700">精選活動</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex justify-end space-x-3 px-6 py-4 bg-gray-50 border-t">
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
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Dialog>
  );
} 