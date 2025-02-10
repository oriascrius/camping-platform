"use client";
// ===== React 相關引入 =====
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "next-auth/react";

// ===== UI 元件引入 =====
import { motion } from "framer-motion"; // 動畫效果
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiEye,
  HiEyeOff,
} from "react-icons/hi"; // Icon
import { Breadcrumb } from "antd"; // 麵包屑導航
import { HomeOutlined } from "@ant-design/icons"; // 首頁 Icon
import { showLoginAlert } from "@/utils/sweetalert"; // 自定義提醒工具，彈窗提示
import Loading from '@/components/Loading';  // 引入 Loading 組件

export default function LoginForm() {
  // ===== 狀態管理 =====
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // 載入狀態
  const [showPassword, setShowPassword] = useState(false); // 密碼顯示狀態

  // ===== 表單控制 =====
  const {
    register, // 註冊表單欄位
    handleSubmit, // 處理表單提交
    formState: { errors, isValid }, // 表單狀態
    clearErrors, // 清除錯誤
  } = useForm({
    // 表單預設值
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange", // 表單驗證模式：值變更時驗證
  });

  // ===== 表單提交處理 =====
  const onSubmit = async (data) => {
    try {
      clearErrors();
      setIsLoading(true);  // 開始顯示 loading

      // 執行登入
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      // 處理登入失敗
      if (result?.error) {
        await showLoginAlert.failure();
        setIsLoading(false);  // 登入失敗關閉 loading
        return;
      }

      // 立即獲取 session
      let session = await getSession();
      
      // 如果沒有 session，等待並重試
      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        session = await getSession();
      }

      if (!session) {
        await showLoginAlert.error();
        setIsLoading(false);
        return;
      }

      // 處理重導向路徑
      const searchParams = new URLSearchParams(window.location.search);
      let callbackUrl = searchParams.get("callbackUrl") || 
                       localStorage.getItem("redirectAfterLogin");

      // 如果沒有指定的重導向路徑，根據使用者角色決定
      if (!callbackUrl) {
        if (session.user.isAdmin) {
          callbackUrl = '/admin';
        } else if (session.user.isOwner) {
          callbackUrl = '/owner';
        } else {
          callbackUrl = '/';
        }
      }

      // 延長等待時間並執行重導向
      setTimeout(() => {
        localStorage.removeItem("redirectAfterLogin");
        router.replace(callbackUrl);
        window.location.href = callbackUrl;
      }, 1500);  // 1.5 秒後重導向

    } catch (error) {
      await showLoginAlert.error();
      setIsLoading(false);  // 發生錯誤時關閉 loading
    }
  };

  // 添加 Google 登入按鈕
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: window.location.search.includes("callbackUrl")
          ? new URLSearchParams(window.location.search).get("callbackUrl")
          : "/"
      });

      if (result?.error) {
        await showLoginAlert.failure();
        setIsLoading(false);
        return;
      }

      // 獲取 session
      const session = await getSession();
      
      // 處理重導向路徑
      const searchParams = new URLSearchParams(window.location.search);
      let callbackUrl = searchParams.get("callbackUrl") || 
                       localStorage.getItem("redirectAfterLogin") || 
                       "/";

      // 延長等待時間並執行重導向
      setTimeout(() => {
        localStorage.removeItem("redirectAfterLogin");
        router.replace(callbackUrl);
        window.location.href = callbackUrl;
      }, 1500);

    } catch (error) {
      await showLoginAlert.error();
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Loading 組件 */}
      <Loading isLoading={isLoading} />

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
                  <Link
                    href="/"
                    className="text-gray-500 hover:text-[#6B8E7B] transition-colors"
                  >
                    <HomeOutlined className="mr-1" />
                    首頁
                  </Link>
                ),
              },
              {
                title: "會員登入",
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
                    }
                  })}
                  className={`pl-12 pr-4 py-4 w-full rounded-xl 
                            bg-gray-50/50 border
                            focus:outline-none focus:ring-1 
                            transition-all duration-300
                            ${errors.email 
                              ? 'border-red-300 focus:ring-red-200 focus:border-red-300' 
                              : 'border-gray-100 focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'
                            }`}
                  placeholder="請輸入電子信箱"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

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
                    }
                  })}
                  className={`pl-12 pr-12 py-4 w-full rounded-xl 
                            bg-gray-50/50 border
                            focus:outline-none focus:ring-1 
                            transition-all duration-300
                            ${errors.password 
                              ? 'border-red-300 focus:ring-red-200 focus:border-red-300' 
                              : 'border-gray-100 focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'
                            }`}
                  placeholder="請輸入密碼"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center
                           text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <HiEyeOff className="text-xl" />
                  ) : (
                    <HiEye className="text-xl" />
                  )}
                </button>
              </div>

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
                {isLoading ? "登入中..." : "登入"}
              </motion.button>

              {/* 其他選項 */}
              <div className="flex justify-between items-center mt-4">
                <Link
                  href="/auth/register"
                  className="text-sm text-gray-500 hover:text-[#6B8E7B] transition-colors"
                >
                  註冊新帳號
                </Link>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-gray-500 hover:text-[#6B8E7B] transition-colors"
                >
                  忘記密碼？
                </Link>
              </div>
            </div>
          </motion.form>

          {/* 在登入按鈕下方添加分隔線和 Google 登入按鈕 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 
                      py-4 px-4 rounded-xl text-gray-700
                      bg-white border border-gray-200
                      hover:bg-gray-50 transition-all duration-300
                      disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            使用 Google 帳號登入
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
