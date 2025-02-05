'use client';
// ===== React 相關引入 =====
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ===== UI 元件引入 =====
import { motion } from 'framer-motion';  // 動畫效果
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff, HiOutlineUser } from 'react-icons/hi';  // Icon
import Swal from 'sweetalert2';  // 彈窗提示
import { Breadcrumb } from 'antd';  // 麵包屑導航
import { HomeOutlined } from '@ant-design/icons';  // 首頁 Icon
import React from 'react';

export default function RegisterForm() {
  // ===== 狀態管理 =====
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);  // 密碼顯示狀態
  const [isLoading, setIsLoading] = useState(false);       // 載入狀態
  const [focusedInput, setFocusedInput] = useState(null);  // 輸入框焦點狀態
  const [role, setRole] = useState('user');                // 用戶角色狀態

  // ===== 表單控制 =====
  const {
    register,           // 註冊表單欄位
    handleSubmit,       // 處理表單提交
    formState: { errors }, // 表單錯誤狀態
    setError,          // 設置錯誤
    clearErrors,       // 清除錯誤
    watch              // 監聽表單值變化
  } = useForm({
    // 表單預設值
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user'
    },
    mode: 'onChange'  // 表單驗證模式
  });

  // ===== 監聽表單值變化，清除對應錯誤 =====
  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name) {
        clearErrors(name);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  // ===== 表單提交處理 =====
  const onSubmit = async (data) => {
    clearErrors();
    setIsLoading(true);

    try {
      // 發送註冊請求
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: role
        }),
      });

      const responseData = await res.json();

      // 處理註冊失敗
      if (!res.ok) {
        throw new Error(responseData.error || '註冊失敗');
      }

      // 註冊成功提示
      await Swal.fire({
        icon: 'success',
        title: '註冊成功！',
        text: '歡迎加入我們的露營社群',
        timer: 1500,
        showConfirmButton: false
      });

      // 根據角色設定跳轉路徑
      const callbackUrl = role === 'owner' ? '/owner' : '/';
      
      // 自動登入
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      // 處理登入失敗
      if (result?.error) {
        throw new Error(result.error);
      }

      // 跳轉到對應頁面
      router.push(callbackUrl);

    } catch (error) {
      // 錯誤處理
      setError('root', { 
        type: 'manual',
        message: error.message 
      });
      
      // 錯誤提示
      Swal.fire({
        icon: 'error',
        title: '註冊失敗',
        text: error.message,
        confirmButtonColor: '#6B8E7B',
        confirmButtonText: '確定'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 渲染表單 =====
  return (
    <div className="w-full">
      {/* 麵包屑導航 */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Breadcrumb
          items={[
            {
              title: (
                <Link href="/" className="text-gray-500 hover:text-[#6B8E7B] transition-colors">
                  <HomeOutlined className="mr-1" />
                  首頁
                </Link>
              ),
            },
            {
              title: (
                <Link href="/auth/login" className="text-gray-500 hover:text-[#6B8E7B] transition-colors">
                  會員登入
                </Link>
              ),
            },
            {
              title: '註冊帳號',
            },
          ]}
        />
      </motion.div>

      {/* 主要內容區塊 - 使用 flex 實現左右布局 */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* 左側：註冊表單 */}
        <motion.div 
          className="flex-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.form 
            onSubmit={handleSubmit(onSubmit)} 
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
                創建帳號
              </motion.h2>
              <motion.p 
                className="text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                開始你的露營旅程
              </motion.p>
            </motion.div>

            {/* 分隔線 */}
            <motion.div 
              className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8 }}
            />

            {/* 輸入框區域 */}
            <div className="space-y-4 mt-8">
              {/* 姓名輸入框 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                  <HiOutlineUser className="text-xl text-gray-400" />
                </div>
                <input
                  {...register("name", {
                    required: "請輸入姓名",
                    minLength: {
                      value: 2,
                      message: "姓名至少需要2個字符"
                    }
                  })}
                  className={`pl-12 pr-4 py-4 w-full rounded-xl 
                           bg-gray-50/50 border transition-all duration-300
                           ${errors.name ? 'border-red-300' : 'border-gray-100'}
                           focus:outline-none focus:ring-1 
                           ${errors.name 
                             ? 'focus:ring-red-300/30 focus:border-red-300/30' 
                             : 'focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'}`}
                  placeholder="請輸入姓名"
                />
                {errors.name && (
                  <span className="text-red-500 text-sm mt-1 block">{errors.name.message}</span>
                )}
              </div>

              {/* 電子郵件輸入框 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                  <HiOutlineMail className="text-xl text-gray-400" />
                </div>
                <input
                  type="email"
                  {...register("email", {
                    required: "請輸入電子信箱",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "請輸入有效的電子信箱格式"
                    }
                  })}
                  className={`pl-12 pr-4 py-4 w-full rounded-xl 
                           bg-gray-50/50 border transition-all duration-300
                           ${errors.email ? 'border-red-300' : 'border-gray-100'}
                           focus:outline-none focus:ring-1 
                           ${errors.email 
                             ? 'focus:ring-red-300/30 focus:border-red-300/30' 
                             : 'focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'}`}
                  placeholder="請輸入電子信箱"
                />
                {errors.email && (
                  <span className="text-red-500 text-sm mt-1 block">{errors.email.message}</span>
                )}
              </div>

              {/* 密碼輸入框 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                  <HiOutlineLockClosed className="text-xl text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "請輸入密碼",
                    minLength: {
                      value: 8,
                      message: "密碼長度至少需要8個字元"
                    }
                  })}
                  className={`pl-12 pr-12 py-4 w-full rounded-xl 
                           bg-gray-50/50 border transition-all duration-300
                           ${errors.password ? 'border-red-300' : 'border-gray-100'}
                           focus:outline-none focus:ring-1 
                           ${errors.password 
                             ? 'focus:ring-red-300/30 focus:border-red-300/30' 
                             : 'focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'}`}
                  placeholder="請輸入密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? <HiEyeOff className="text-xl" /> : <HiEye className="text-xl" />}
                </button>
                {errors.password && (
                  <span className="text-red-500 text-sm mt-1 block">{errors.password.message}</span>
                )}
              </div>

              {/* 身分選擇 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  註冊身分
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* 一般會員選項 */}
                  <label 
                    className={`relative flex flex-col items-center p-4 rounded-xl cursor-pointer
                              border-2 transition-all duration-200 group
                              ${role === 'user' 
                                ? 'border-[#6B8E7B] bg-[#6B8E7B]/5' 
                                : 'border-gray-200 hover:border-[#6B8E7B]/50'}`}
                  >
                    <input
                      type="radio"
                      value="user"
                      checked={role === 'user'}
                      onChange={(e) => setRole(e.target.value)}
                      className="absolute opacity-0"
                    />
                    <div className="flex items-center justify-center w-12 h-12 mb-3
                                  rounded-full bg-[#6B8E7B]/10 group-hover:bg-[#6B8E7B]/20
                                  transition-all duration-200">
                      <svg 
                        className={`w-6 h-6 ${role === 'user' ? 'text-[#6B8E7B]' : 'text-gray-500'}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                        />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium
                                   ${role === 'user' ? 'text-[#6B8E7B]' : 'text-gray-600'}`}>
                      一般會員
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      適合想要預訂營地的露營愛好者
                    </span>
                  </label>

                  {/* 營地主選項 */}
                  <label 
                    className={`relative flex flex-col items-center p-4 rounded-xl cursor-pointer
                              border-2 transition-all duration-200 group
                              ${role === 'owner' 
                                ? 'border-[#6B8E7B] bg-[#6B8E7B]/5' 
                                : 'border-gray-200 hover:border-[#6B8E7B]/50'}`}
                  >
                    <input
                      type="radio"
                      value="owner"
                      checked={role === 'owner'}
                      onChange={(e) => setRole(e.target.value)}
                      className="absolute opacity-0"
                    />
                    <div className="flex items-center justify-center w-12 h-12 mb-3
                                  rounded-full bg-[#6B8E7B]/10 group-hover:bg-[#6B8E7B]/20
                                  transition-all duration-200">
                      <svg 
                        className={`w-6 h-6 ${role === 'owner' ? 'text-[#6B8E7B]' : 'text-gray-500'}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                        />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium
                                   ${role === 'owner' ? 'text-[#6B8E7B]' : 'text-gray-600'}`}>
                      營地主
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      適合想要管理營地的營地擁有者
                    </span>
                  </label>
                </div>
              </div>

              {/* 註冊按鈕 */}
              <motion.button
                type="submit"
                disabled={isLoading || Object.keys(errors).length > 0}
                className="w-full py-4 px-4 rounded-xl text-white
                         bg-[#6B8E7B] hover:bg-[#5F7A68]
                         transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? '註冊中...' : '註冊'}
              </motion.button>

              {/* 登入連結 */}
              <motion.div
                className="text-center mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <span className="text-sm text-gray-500">
                  已經有帳號？{' '}
                  <Link 
                    href="/auth/login" 
                    className="text-[#6B8E7B] hover:text-[#5F7A68]
                             transition-colors duration-200"
                  >
                    立即登入
                  </Link>
                </span>
              </motion.div>
            </div>
          </motion.form>
        </motion.div>

        {/* 右側：註冊須知 */}
        <motion.div 
          className="md:w-80 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="sticky top-4 space-y-6 p-6 rounded-3xl
                        bg-white/80 backdrop-blur-sm
                        shadow-[0_0_15px_rgba(0,0,0,0.05)]">
            <div>
              <h3 className="font-medium text-[#6B8E7B] mb-4">
                {role === 'owner' ? '營地主註冊須知：' : '會員註冊須知：'}
              </h3>
              
              {/* 帳號相關提醒 */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2"></span>
                  <p className="text-sm text-gray-600">請使用有效的電子信箱作為帳號</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2"></span>
                  <p className="text-sm text-gray-600">此信箱將用於接收重要通知及密碼重設</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">密碼要求：</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2"></span>
                  <p className="text-sm text-gray-600">至少8個字符</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2"></span>
                  <p className="text-sm text-gray-600">建議包含大小寫字母和數字</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2"></span>
                  <p className="text-sm text-gray-600">避免使用容易被猜到的密碼</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">注意事項：</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2"></span>
                  <p className="text-sm text-gray-600">註冊完成後將自動登入</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2"></span>
                  <p className="text-sm text-gray-600">如果已有帳號，請直接登入</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2"></span>
                  <p className="text-sm text-gray-600">請妥善保管您的帳號密碼</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 錯誤提示 */}
      {errors.root && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errors.root.message}
        </motion.div>
      )}
    </div>
  );
}