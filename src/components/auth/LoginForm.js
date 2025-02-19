"use client";
// ===== React 相關引入 =====
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSession } from "next-auth/react";
import Swal from "sweetalert2";
import { showLoginAlert } from "@/utils/sweetalert";  // 確保正確引入

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
import Loading from '@/components/Loading';  // 引入 Loading 組件

export default function LoginForm() {
  // ===== 狀態管理 =====
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
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

  useEffect(() => {
    // 處理 URL 中的錯誤訊息
    if (error) {
      showLoginAlert.googleError(decodeURIComponent(error));
      window.history.replaceState({}, '', '/auth/login');
    }
  }, [error]);

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

  // 修改 handleGoogleSignIn 函數
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
        switch (result.error) {
          case "EMAIL_EXISTS":
            await showLoginAlert.googleEmailExists();
            break;
          case "LOGIN_FAILED":
            await showLoginAlert.googleFailure();
            break;
          default:
            await showLoginAlert.error("登入過程發生錯誤");
            break;
        }
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
      await showLoginAlert.error("系統錯誤，請稍後再試");
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Loading 組件 */}
      <Loading isLoading={isLoading} />

      <div className="w-full max-w-[400px] mx-auto">
        {/* 麵包屑導航 */}
        <motion.div
          className="mb-4"
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
                    className="text-gray-500 hover:text-[#6B8E7B] transition-colors no-underline"
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
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 p-6 rounded-2xl
                      bg-white/80 backdrop-blur-sm
                      shadow-[0_0_15px_rgba(0,0,0,0.05)]"
          >
            {/* 標題區域 */}
            <motion.div
              className="text-center space-y-1 mb-6"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h2
                className="text-2xl font-medium text-[#6B8E7B]"
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

            {/* Google 登入按鈕 */}
            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl
                       bg-white border border-gray-200
                       hover:bg-gray-50 hover:border-gray-300
                       transition-all duration-300
                       flex items-center justify-center gap-3
                       disabled:opacity-50 disabled:cursor-not-allowed
                       group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" 
                   viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
              </svg>
              <span className="text-sm text-gray-600 font-medium group-hover:text-gray-800">
                {isLoading ? "處理中..." : "使用 Google 帳號登入"}
              </span>
            </motion.button>

            {/* 分隔線與文字 */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white/80 text-gray-500">或使用電子信箱登入</span>
              </div>
            </div>

            {/* 輸入框區域 */}
            <div className="space-y-3">
              {/* 電子郵件輸入框 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiOutlineMail className="text-lg text-gray-400" />
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
                  className={`pl-12 pr-4 py-3 w-full rounded-xl 
                            bg-gray-50/50 border text-sm
                            focus:outline-none focus:ring-1 
                            transition-all duration-300
                            ${errors.email 
                              ? 'border-red-300 focus:ring-red-200 focus:border-red-300' 
                              : 'border-gray-100 focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'
                            }`}
                  placeholder="請輸入電子信箱"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* 密碼輸入框 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="text-lg text-gray-400" />
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
                  className={`pl-12 pr-12 py-3 w-full rounded-xl 
                            bg-gray-50/50 border text-sm
                            focus:outline-none focus:ring-1 
                            transition-all duration-300
                            ${errors.password 
                              ? 'border-red-300 focus:ring-red-200 focus:border-red-300' 
                              : 'border-gray-100 focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'
                            }`}
                  placeholder="請輸入密碼"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center
                           text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <HiEyeOff className="text-lg" />
                  ) : (
                    <HiEye className="text-lg" />
                  )}
                </button>
              </div>
            </div>

            {/* 登入按鈕 */}
            <motion.button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full py-3 px-4 rounded-xl text-white text-sm
                       bg-[#6B8E7B] hover:bg-[#5F7A68]
                       transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isLoading ? "登入中..." : "登入"}
            </motion.button>
            {/* 其他選項 */}
            <div className="flex justify-between items-center mt-4 text-[14px]">
              <Link
                href="/auth/register"
                className="text-gray-500 hover:text-[#6B8E7B] transition-colors no-underline"
              >
                註冊新帳號
              </Link>
              <Link
                href="/auth/forgot-password"
                className="text-gray-500 hover:text-[#6B8E7B] transition-colors no-underline"
              >
                忘記密碼？
              </Link>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </>
  );
}
