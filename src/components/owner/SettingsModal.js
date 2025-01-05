"use client";
import { useState, useEffect } from "react";
import { HiX, HiExclamationCircle, HiInformationCircle } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast 共用配置
const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
};

// 成功提示樣式
const successStyle = {
  style: {
    background: '#E8F1ED',
    color: '#2C4A3B',
  },
  progressStyle: {
    background: '#6B8E7B'
  }
};

// 錯誤提示樣式
const errorStyle = {
  style: {
    background: '#F5E6E8',
    color: '#9B6B70'
  },
  progressStyle: {
    background: '#BA8E93'
  }
};

export default function SettingsModal({ isOpen, onClose, type, ownerData, onUpdate }) {
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

  // 密碼錯誤訊息
  const [passwordErrors, setPasswordErrors] = useState({});

  // 錯誤狀態
  const [errors, setErrors] = useState({});

  // 當 ownerData 變更時更新表單
  useEffect(() => {
    console.log('Modal 收到的 ownerData:', ownerData);
    if (ownerData && typeof ownerData === 'object') {
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

  // 檢查表單資料
  useEffect(() => {
    console.log('表單當前資料:', formData);
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
    // 當使用者開始輸入時，清除該欄位的錯誤訊息
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 驗證表單
  const validateForm = () => {
    const newErrors = {};
    
    // 驗證必填欄位
    if (!formData.name.trim()) {
      newErrors.name = '請填寫營主姓名';
    }
    if (!formData.company_name.trim()) {
      newErrors.company_name = '請填寫公司名稱';
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = '請填寫聯絡電話';
    }
    if (!formData.address?.trim()) {
      newErrors.address = '請填寫地址';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // 返回是否驗證通過
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch('/api/owner/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('更新失敗');
      }

      onUpdate && onUpdate();
      onClose();
      toast.success('個人資料更新成功！', {
        ...toastConfig,
        ...successStyle,
        icon: '🎉'
      });
    } catch (error) {
      toast.error('更新失敗，請稍後再試', {
        ...toastConfig,
        ...errorStyle,
        icon: '❌'
      });
    }
  };

  // 驗證密碼表單
  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = '請輸入目前密碼';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = '請輸入新密碼';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = '密碼長度至少需要8個字元';
    }

    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = '請確認新密碼';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = '兩次輸入的密碼不相符';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理密碼更新
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      const response = await fetch('/api/owner/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '密碼更新失敗');
      }

      // 清空表單
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // 關閉 Modal
      onClose();
      
      // 成功提示
      toast.success('密碼更新成功！', {
        ...toastConfig,
        ...successStyle,
        icon: '🔑'
      });

    } catch (error) {
      toast.error(error.message || '密碼更新失敗，請稍後再試', {
        ...toastConfig,
        ...errorStyle,
        icon: '❌'
      });
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div className="bg-white rounded-xl shadow-xl w-[520px] max-h-[90vh] flex flex-col">
              {/* 標題區塊 */}
              <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-[#A8C2B5]/20 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#2C4A3B]">
                  {type === 'profile' ? '個人資料' : '修改密碼'}
                </h2>
                <button onClick={onClose}>
                  <HiX className="w-5 h-5 text-[#2C4A3B]" />
                </button>
              </div>

              {/* 表單內容 - 加入可滾動區域 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {type === 'profile' ? (
                    // 個人資料表單
                    <div>
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
                            營主姓名 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border 
                              ${errors.name ? 'border-red-500' : 'border-[#A8C2B5]/30'}
                              focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]`}
                          />
                          {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                          )}
                        </div>

                        {/* 公司名稱 */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-[#2C4A3B]">
                            公司名稱 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border 
                              ${errors.company_name ? 'border-red-500' : 'border-[#A8C2B5]/30'}
                              focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]`}
                          />
                          {errors.company_name && (
                            <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
                          )}
                        </div>

                        {/* 聯絡電話 */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-[#2C4A3B]">
                            聯絡電話 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border 
                              ${errors.phone ? 'border-red-500' : 'border-[#A8C2B5]/30'}
                              focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]`}
                          />
                          {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                          )}
                        </div>

                        {/* 地址 */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-[#2C4A3B]">
                            地址 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border 
                              ${errors.address ? 'border-red-500' : 'border-[#A8C2B5]/30'}
                              focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]`}
                          />
                          {errors.address && (
                            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                          )}
                        </div>
                      </div>

                      {/* 帳號狀態 */}
                      <div className="mt-8 space-y-4">
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

                      {/* 按鈕區塊 - 固定在底部 */}
                      <div className="sticky bottom-0 bg-white mt-8 pt-4 border-t border-[#A8C2B5]/20">
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg text-[#2C4A3B] hover:bg-[#A8C2B5]/10
                                     transition-colors duration-200 font-medium"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSubmit}
                            className="px-6 py-2.5 rounded-lg bg-[#6B8E7B] text-white
                                     hover:bg-[#5A7A68] transition-colors duration-200
                                     focus:ring-2 focus:ring-[#6B8E7B]/20 focus:ring-offset-2
                                     font-medium"
                          >
                            確認
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 密碼修改表單
                    <div>
                      <div className="space-y-6">
                        {/* 目前密碼 */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-[#2C4A3B]">
                            目前密碼 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            className={`w-full px-4 py-3 rounded-lg border 
                              ${passwordErrors.currentPassword ? 'border-red-500' : 'border-[#A8C2B5]/30'}
                              focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]`}
                          />
                          {passwordErrors.currentPassword && (
                            <p className="text-red-500 text-sm">{passwordErrors.currentPassword}</p>
                          )}
                        </div>

                        {/* 新密碼 */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-[#2C4A3B]">
                            新密碼 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            className={`w-full px-4 py-3 rounded-lg border 
                              ${passwordErrors.newPassword ? 'border-red-500' : 'border-[#A8C2B5]/30'}
                              focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]`}
                          />
                          {passwordErrors.newPassword && (
                            <p className="text-red-500 text-sm">{passwordErrors.newPassword}</p>
                          )}
                        </div>

                        {/* 確認新密碼 */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-[#2C4A3B]">
                            確認新密碼 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange}
                            className={`w-full px-4 py-3 rounded-lg border 
                              ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-[#A8C2B5]/30'}
                              focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]`}
                          />
                          {passwordErrors.confirmPassword && (
                            <p className="text-red-500 text-sm">{passwordErrors.confirmPassword}</p>
                          )}
                        </div>

                        {/* 一般錯誤訊息 */}
                        {passwordErrors.submit && (
                          <p className="text-red-500 text-sm mt-4">{passwordErrors.submit}</p>
                        )}
                      </div>

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
                          onClick={handlePasswordSubmit}
                          className="px-6 py-2.5 rounded-lg bg-[#6B8E7B] text-white
                                   hover:bg-[#5A7A68] transition-colors duration-200
                                   focus:ring-2 focus:ring-[#6B8E7B]/20 focus:ring-offset-2
                                   font-medium"
                        >
                          確認
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
