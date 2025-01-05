"use client";
import { useState, useEffect } from "react";
import { HiX, HiExclamationCircle, HiInformationCircle } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormModal, { showSuccessToast, showErrorToast } from '@/components/owner/common/FormModal';

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
      showSuccessToast('個人資料更新成功！');
    } catch (error) {
      showErrorToast('更新失敗，請稍後再試');
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
      showSuccessToast('密碼更新成功！');

    } catch (error) {
      showErrorToast(error.message || '密碼更新失敗，請稍後再試');
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'profile' ? '個人資料' : '修改密碼'}
      onSubmit={type === 'profile' ? handleSubmit : handlePasswordSubmit}
    >
      {type === 'profile' ? (
        // 個人資料表單內容
        <div className="space-y-6">
          {/* ... 表單欄位 ... */}
        </div>
      ) : (
        // 密碼修改表單內容
        <div className="space-y-6">
          {/* ... 密碼表單欄位 ... */}
        </div>
      )}
    </FormModal>
  );
}
