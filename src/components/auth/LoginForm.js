'use client';
// ===== React 相關引入 =====
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ===== UI 元件引入 =====
import { motion } from 'framer-motion';  // 動畫效果
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';  // Icon
import Swal from 'sweetalert2';  // 彈窗提示
import { Breadcrumb } from 'antd';  // 麵包屑導航
import { HomeOutlined } from '@ant-design/icons';  // 首頁 Icon
import React from 'react';

export default function LoginForm() {
  // ===== 狀態管理 =====
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);       // 載入狀態
  const [showPassword, setShowPassword] = useState(false);  // 密碼顯示狀態
  const [error, setError] = useState('');                  // 錯誤訊息狀態

  // ===== 表單控制 =====
  const {
    register,           // 註冊表單欄位
    handleSubmit,       // 處理表單提交
    formState: { errors, touchedFields, isValid },  // 表單狀態
    setError: setFormError,  // 設置表單錯誤
    clearErrors,        // 清除錯誤
    watch               // 監聽表單值變化
  } = useForm({
    // 表單預設值
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onChange'    // 表單驗證模式：值變更時驗證
  });

  // ===== 監聽表單值變化，清除對應錯誤 =====
  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name) {
        clearErrors(name);
        setError('');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  // ===== 表單提交處理 =====
  const onSubmit = async (data) => {
    clearErrors();
    setError('');
    setIsLoading(true);

    try {
      // 執行登入
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password
      });

      // 處理登入失敗
      if (result?.error) {
        setError('電子郵件或密碼錯誤');
        setFormError('password', {
          type: 'manual',
          message: '電子郵件或密碼錯誤'
        });
        
        await Swal.fire({
          icon: 'error',
          title: '登入失敗',
          text: '電子郵件或密碼錯誤，請重新確認',
          confirmButtonColor: '#6B8E7B',
          confirmButtonText: '確定'
        });
        return;
      }

      // 登入成功提示
      await Swal.fire({
        icon: 'success',
        title: '登入成功',
        text: '歡迎回來！',
        timer: 1500,
        showConfirmButton: false
      });

      // 根據用戶身分決定跳轉路徑
      // if (result.ok) {
      //   // 使用 replace 避免瀏覽歷史堆疊
      //   router.replace(result.url || '/');  
      // }
      
    } catch (err) {
      // 系統錯誤處理
      setError('登入時發生錯誤，請稍後再試');
      setFormError('password', {
        type: 'manual',
        message: '登入時發生錯誤，請稍後再試'
      });
      
      await Swal.fire({
        icon: 'error',
        title: '系統錯誤',
        text: '登入時發生錯誤，請稍後再試',
        confirmButtonColor: '#6B8E7B',
        confirmButtonText: '確定'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
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
              title: '會員登入',
            },
          ]}
        />
      </motion.div>

      <motion.div 
        className="relative space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
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
              歡迎回來
            </motion.h2>
            <motion.p 
              className="text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              探索你的露營新體驗
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
            {/* 電子郵件輸入框 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlineMail className="text-xl text-gray-400" />
              </div>
              <input
                type="email"
                {...register("email", {
                  required: "請輸入電子信箱",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "請輸入有效的電子信箱"
                  },
                  onChange: () => {
                    if (error) setError('');
                  }
                })}
                className={`pl-12 pr-4 py-4 w-full rounded-xl 
                          bg-gray-50/50 border 
                          ${errors.email ? 'border-red-300' : 'border-gray-100'}
                          focus:outline-none focus:ring-1 
                          ${errors.email 
                            ? 'focus:ring-red-300/30 focus:border-red-300/30' 
                            : 'focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'}
                          transition-all duration-300`}
                placeholder="請輸入電子信箱"
              />
            </div>
            {touchedFields.email && errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}

            {/* 密碼輸入框 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlineLockClosed className="text-xl text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                {...register("password", {
                  required: "請輸入密碼",
                  minLength: {
                    value: 8,
                    message: "密碼長度至少需要8個字元"
                  },
                  onChange: () => {
                    if (error) setError('');
                  }
                })}
                className={`pl-12 pr-12 py-4 w-full rounded-xl 
                          bg-gray-50/50 border 
                          ${errors.password ? 'border-red-300' : 'border-gray-100'}
                          focus:outline-none focus:ring-1 
                          ${errors.password 
                            ? 'focus:ring-red-300/30 focus:border-red-300/30' 
                            : 'focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'}
                          transition-all duration-300`}
                placeholder="請輸入密碼"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center
                         text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <HiEyeOff className="text-xl" /> : <HiEye className="text-xl" />}
              </button>
            </div>
            {touchedFields.password && errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}

            {/* 登入按鈕 */}
            <motion.button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full py-4 px-4 rounded-xl text-white
                       bg-[#6B8E7B] hover:bg-[#5F7A68]
                       transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? '登入中...' : '登入'}
            </motion.button>

            {/* 忘記密碼連結 */}
            <div className="text-center">
              <Link 
                href="/auth/forgot-password"
                className="text-sm text-[#6B8E7B] hover:text-[#5F7A68]
                         transition-colors duration-200"
              >
                忘記密碼？
              </Link>
            </div>
          </div>

          {/* 分隔線 */}
          <motion.div 
            className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* 註冊連結 */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-sm text-gray-500">
              還沒有帳號？{' '}
              <Link 
                href="/auth/register" 
                className="text-[#6B8E7B] hover:text-[#5F7A68]
                         transition-colors duration-200"
              >
                立即註冊
              </Link>
            </span>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
}