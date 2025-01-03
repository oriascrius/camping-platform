"use client";
import { useState, useEffect } from "react";
import { HiX, HiExclamationCircle, HiInformationCircle } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsModal({ isOpen, onClose, type, ownerData }) {
  // 個人資料表單
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    name: '',
    company_name: '',
    phone: '',
    address: '',
    status: 1
  });

  // 密碼表單
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 當 ownerData 變更時更新表單
  useEffect(() => {
    if (ownerData) {  // 直接檢查 ownerData 是否存在
      console.log('要設置的資料:', ownerData);
      
      setFormData({
        id: ownerData.id?.toString() || '',
        email: ownerData.email || '',
        name: ownerData.name || '',
        company_name: ownerData.company_name || '',
        phone: ownerData.phone || '',
        address: ownerData.address || '',
        status: ownerData.status || 1
      });
    }
  }, [ownerData]);

  // 檢查表單資料是否正確設置
  useEffect(() => {
    console.log('當前表單資料:', formData);
  }, [formData]);

  // 處理個人資料變更
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 處理密碼變更
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (type === 'profile') {
        // 處理個人資料更新
        const response = await fetch('/api/owner/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('更新失敗');
        }

        // 更新成功
        console.log('個人資料更新成功');
        onClose(); // 關閉 Modal

      } else {
        // 處理密碼更新
        // 先驗證新密碼
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          alert('新密碼與確認密碼不符');
          return;
        }

        const response = await fetch('/api/owner/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
          })
        });

        if (!response.ok) {
          throw new Error('密碼更新失敗');
        }

        // 更新成功
        console.log('密碼更新成功');
        onClose(); // 關閉 Modal
        
        // 清空密碼表單
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('更新失敗:', error);
      alert(error.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-xl shadow-xl w-[520px] max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* 標題區塊 */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#A8C2B5]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2C4A3B]">
                {type === 'profile' ? '個人資料' : '修改密碼'}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[#A8C2B5]/10 rounded-full transition-colors"
              >
                <HiX className="w-5 h-5 text-[#2C4A3B]" />
              </button>
            </div>

            {/* 表單內容 */}
            <form onSubmit={handleSubmit} className="p-6">
              {type === 'profile' ? (
                // 個人資料表單
                <div className="space-y-6">
                  {/* 基本資訊區塊 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#2C4A3B] pb-2 border-b-2 border-[#6B8E7B]">
                      基本資訊
                    </h3>
                    
                    {/* 營主編號 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#2C4A3B]">
                        營主編號
                      </label>
                      <input
                        type="text"
                        value={formData.id || ''}
                        disabled
                        className="w-full px-4 py-3 rounded-lg border border-[#A8C2B5]/30
                                 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    {/* 電子郵件 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#2C4A3B]">
                        電子郵件
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        disabled
                        className="w-full px-4 py-3 rounded-lg border border-[#A8C2B5]/30
                                 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    {/* 營主姓名 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#2C4A3B]">
                        營主姓名
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#A8C2B5]/30
                                 focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]"
                      />
                    </div>

                    {/* 公司名稱 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#2C4A3B]">
                        公司名稱
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#A8C2B5]/30
                                 focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]"
                      />
                    </div>

                    {/* 聯絡電話 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#2C4A3B]">
                        聯絡電話
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#A8C2B5]/30
                                 focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]"
                      />
                    </div>

                    {/* 地址 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#2C4A3B]">
                        地址
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#A8C2B5]/30
                                 focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]"
                      />
                    </div>
                  </div>

                  {/* 帳號狀態 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#2C4A3B] pb-2 border-b-2 border-[#6B8E7B]">
                      帳號狀態
                    </h3>
                    <div className={`px-4 py-3 rounded-lg ${
                      formData.status === 1 
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {formData.status === 1 ? '啟用' : '停用'}
                    </div>
                  </div>
                </div>
              ) : (
                // 修改密碼表單
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-[#2C4A3B] pb-2 border-b-2 border-[#6B8E7B]">
                    修改密碼
                  </h3>
                  
                  <div className="space-y-4">
                    {/* 目前密碼 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#2C4A3B]">
                        目前密碼
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#A8C2B5]/30
                                 focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]"
                      />
                    </div>

                    {/* 新密碼 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#2C4A3B]">
                        新密碼
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#A8C2B5]/30
                                 focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]"
                      />
                    </div>

                    {/* 確認新密碼 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#2C4A3B]">
                        確認新密碼
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#A8C2B5]/30
                                 focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 按鈕區塊 */}
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-[#A8C2B5]/20">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg text-[#2C4A3B] hover:bg-[#A8C2B5]/10
                           transition-colors duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-[#6B8E7B] text-white
                           hover:bg-[#5A7A68] transition-colors duration-200
                           focus:ring-2 focus:ring-[#6B8E7B]/20 focus:ring-offset-2
                           font-medium"
                >
                  確認
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
