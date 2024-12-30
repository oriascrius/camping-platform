// src/components/auth/ForgotPasswordForm.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="space-y-6">
      {/* 步驟提示 */}
      <div className="text-center mb-4">
        <div className="text-sm text-gray-600">
          步驟 {step}/3
        </div>
        <div className="text-base text-gray-800 mt-1">
          {stepMessages[step]}
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              電子信箱
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="請輸入您的註冊信箱"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {error && (
              <div className="mt-2 text-sm text-red-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            * 驗證碼將發送到您的信箱
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading ? '發送中...' : '發送驗證碼'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              驗證碼
            </label>
            <input
              type="text"
              name="otp"
              required
              maxLength={6}
              placeholder="請輸入6位數驗證碼"
              value={formData.otp}
              onChange={(e) => {
                // 只允許輸入數字
                const value = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({ ...prev, otp: value }));
              }}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {error && (
              <div className="mt-2 text-sm text-red-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>* 驗證碼為6位數字</p>
            <p>* 驗證碼有效期為10分鐘</p>
          </div>
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError('');
                setFormData(prev => ({ ...prev, otp: '' }));
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              重新發送驗證碼
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? '驗證中...' : '驗證'}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              新密碼
            </label>
            <input
              type="password"
              name="newPassword"
              required
              placeholder="請輸入新密碼"
              value={formData.newPassword}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              確認新密碼
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              placeholder="請再次輸入新密碼"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {error && (
              <div className="mt-2 text-sm text-red-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>* 密碼長度至少需要6個字元</p>
            <p>* 密碼不能包含空格</p>
            <p>* 建議使用字母、數字的組合</p>
          </div>
          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? '處理中...' : '確認重設密碼'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}