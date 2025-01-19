// src/components/auth/ForgotPasswordForm.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import { toast } from 'react-toastify';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1:輸入信箱, 2:輸入驗證碼, 3:重設密碼
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');  // 新增錯誤狀態
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 步驟說明文字
  const stepMessages = {
    1: '請輸入您的註冊信箱，我們將發送驗證碼',
    2: '請輸入您收到的 6 位數驗證碼',
    3: '請設定您的新密碼'
  };

  // 發送驗證碼
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');  // 重置錯誤訊息
    
    // 檢查信箱格式
    if (!formData.email) {
      setError('請輸入電子信箱');
      toast.warn('請輸入電子信箱', {
        position: "top-center",
        autoClose: 3000,
        icon: '⚠️'
      });
      return;
    }

    // 驗證信箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('請輸入有效的電子信箱格式');
      toast.error('請輸入有效的電子信箱格式', {
        position: "top-center",
        autoClose: 3000,
        icon: '❌'
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await res.json();
      
      if (res.status === 404) {
        setError('此信箱尚未註冊');
        toast.error('此信箱尚未註冊', {
          position: "top-center",
          autoClose: 3000,
          icon: '❌'
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || '發送失敗');
      }

      setError('');  // 清除錯誤訊息
      toast.success('驗證碼已發送！請查看您的信箱', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        icon: '📧'
      });
      setStep(2);
    } catch (error) {
      setError(error.message);
      toast.error(`發送失敗：${error.message}`, {
        position: "top-center",
        autoClose: 5000,
        icon: '❌'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 驗證 OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');  // 重置錯誤訊息

    // 驗證碼格式檢查
    if (!formData.otp) {
      setError('請輸入驗證碼');
      toast.warn('請輸入驗證碼', {
        position: "top-center",
        autoClose: 3000,
        icon: '⚠️'
      });
      return;
    }

    // 驗證碼必須是6位數字
    if (!/^\d{6}$/.test(formData.otp)) {
      setError('驗證碼必須是6位數字');
      toast.error('驗證碼格式錯誤', {
        position: "top-center",
        autoClose: 3000,
        icon: '❌'
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          otp: formData.otp 
        })
      });

      const data = await res.json();

      if (res.status === 400) {
        setError(data.error || '驗證碼無效');
        toast.error(data.error || '驗證碼無效', {
          position: "top-center",
          autoClose: 3000,
          icon: '❌'
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || '驗證失敗');
      }

      setError('');
      toast.success('驗證成功！請設定新密碼', {
        position: "top-center",
        autoClose: 3000,
        icon: '✅'
      });
      setStep(3);
    } catch (error) {
      setError(error.message);
      toast.error(`驗證失敗：${error.message}`, {
        position: "top-center",
        autoClose: 5000,
        icon: '❌'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 重設密碼
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    // 驗證密碼
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('請輸入新密碼和確認密碼');
      toast.warn('請填寫所有密碼欄位', {
        position: "top-center",
        autoClose: 3000,
        icon: '⚠️'
      });
      return;
    }

    // 檢查密碼長度
    if (formData.newPassword.length < 6) {
      setError('密碼長度至少需要6個字元');
      toast.warn('密碼太短', {
        position: "top-center",
        autoClose: 3000,
        icon: '⚠️'
      });
      return;
    }

    // 檢查密碼是否包含空格
    if (formData.newPassword.includes(' ')) {
      setError('密碼不能包含空格');
      toast.error('密碼格式錯誤', {
        position: "top-center",
        autoClose: 3000,
        icon: '❌'
      });
      return;
    }

    // 檢查密碼一致性
    if (formData.newPassword !== formData.confirmPassword) {
      setError('兩次輸入的密碼不相符');
      toast.error('密碼不相符', {
        position: "top-center",
        autoClose: 3000,
        icon: '❌'
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '重設失敗');
      }

      // 先顯示成功訊息
      toast.success('密碼重設成功！', {
        position: "top-center",
        autoClose: 1500,
      });

      // 直接設定一個延遲跳轉
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);

    } catch (error) {
      setError(error.message);
      toast.error(`重設失敗：${error.message}`, {
        position: "top-center",
        autoClose: 5000,
        icon: '❌'
      });
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <motion.div 
        className="relative space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.form 
          className="space-y-6 p-8 rounded-3xl
                    bg-white/80 backdrop-blur-sm
                    shadow-[0_0_15px_rgba(0,0,0,0.05)]"
        >
          {/* 標題區域 */}
          <motion.div 
            className="text-center space-y-2 mb-8"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="text-3xl font-medium text-gray-800"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              忘記密碼
            </motion.h2>
            <motion.p 
              className="text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* 請輸入您的電子信箱，我們將發送重設密碼連結給您 */}
            </motion.p>
          </motion.div>

          {/* 分隔線 */}
          <motion.div 
            className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* 步驟提示 */}
          <motion.div 
            className="text-center space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-sm font-medium text-[#6B8E7B]">
              步驟 {step}/3
            </div>
            <div className="text-sm text-gray-600">
              {stepMessages[step]}
            </div>
          </motion.div>

          {/* 步驟 1：輸入信箱 */}
          {step === 1 && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiOutlineMail className="text-xl text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="請輸入您的註冊信箱"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-12 pr-4 py-4 w-full rounded-xl 
                           bg-gray-50/50 border border-gray-100
                           focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]/30
                           focus:border-[#6B8E7B]/30 transition-all duration-300"
                />
              </div>

              <motion.button
                type="submit"
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full py-4 px-4 rounded-xl text-white
                         bg-[#6B8E7B] hover:bg-[#5F7A68]
                         transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? '發送中...' : '發送驗證碼'}
              </motion.button>
            </motion.div>
          )}

          {/* 步驟 2：輸入驗證碼 */}
          {step === 2 && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="relative">
                <input
                  type="text"
                  name="otp"
                  required
                  maxLength={6}
                  placeholder="請輸入6位數驗證碼"
                  value={formData.otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, otp: value }));
                  }}
                  className="pl-4 pr-4 py-4 w-full rounded-xl 
                           bg-gray-50/50 border border-gray-100
                           focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]/30
                           focus:border-[#6B8E7B]/30 transition-all duration-300
                           text-center text-lg tracking-widest"
                />
              </div>

              <div className="flex justify-between items-center space-x-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                    setFormData(prev => ({ ...prev, otp: '' }));
                  }}
                  className="py-4 px-4 rounded-xl text-[#6B8E7B] 
                           border border-[#6B8E7B]/30 hover:bg-[#6B8E7B]/5
                           transition-all duration-300 flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  重新發送
                </motion.button>

                <motion.button
                  type="submit"
                  onClick={handleVerifyOTP}
                  disabled={isLoading}
                  className="py-4 px-4 rounded-xl text-white
                           bg-[#6B8E7B] hover:bg-[#5F7A68]
                           transition-all duration-300 flex-1
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? '驗證中...' : '驗證'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* 步驟 3：重設密碼 */}
          {step === 3 && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="text-xl text-gray-400" />
                </div>
                <input
                  type="password"
                  name="newPassword"
                  required
                  placeholder="請輸入新密碼"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="pl-12 pr-4 py-4 w-full rounded-xl 
                           bg-gray-50/50 border border-gray-100
                           focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]/30
                           focus:border-[#6B8E7B]/30 transition-all duration-300"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="text-xl text-gray-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="請再次輸入新密碼"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-12 pr-4 py-4 w-full rounded-xl 
                           bg-gray-50/50 border border-gray-100
                           focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]/30
                           focus:border-[#6B8E7B]/30 transition-all duration-300"
                />
              </div>

              <motion.button
                type="submit"
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full py-4 px-4 rounded-xl text-white
                         bg-[#6B8E7B] hover:bg-[#5F7A68]
                         transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? '處理中...' : '確認重設密碼'}
              </motion.button>
            </motion.div>
          )}

          {/* 錯誤提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 flex items-center justify-center"
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </span>
            </motion.div>
          )}
        </motion.form>
      </motion.div>
    </div>
  );
}