'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('電子郵件或密碼錯誤');
      }
    } catch (err) {
      setError('登入時發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
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
          onSubmit={handleSubmit} 
          className="space-y-6 p-8 rounded-3xl
                    bg-white/80 backdrop-blur-sm
                    shadow-[0_0_15px_rgba(0,0,0,0.05)]"
        >
          {/* 標題區域 - 整合到表單內 */}
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
            <motion.div 
              className={`relative transition-all duration-300 ${
                focusedInput === 'email' ? 'scale-[1.02]' : 'scale-100'
              }`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <motion.div
                  className={`transition-all duration-300 ${
                    focusedInput === 'email' ? 'text-[#6B8E7B]' : 'text-gray-400'
                  }`}
                  animate={focusedInput === 'email' ? { scale: 1.1 } : { scale: 1 }}
                >
                  <HiOutlineMail className="text-xl" />
                </motion.div>
              </div>
              
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                className={`pl-12 pr-4 py-4 w-full rounded-xl 
                         bg-gray-50/50 border transition-all duration-300
                         ${focusedInput === 'email' 
                           ? 'border-[#6B8E7B] ring-1 ring-[#6B8E7B] shadow-[0_0_15px_rgba(107,142,123,0.15)]' 
                           : 'border-gray-100 hover:border-[#6B8E7B]/30'}
                         focus:outline-none`}
                placeholder="請輸入電子郵件"
                required
              />
              
              <AnimatePresence>
                {email && focusedInput === 'email' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 
                             bg-[#6B8E7B] rounded-full"
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* 密碼輸入框 */}
            <motion.div 
              className={`relative transition-all duration-300 ${
                focusedInput === 'password' ? 'scale-[1.02]' : 'scale-100'
              }`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <motion.div
                  className={`transition-all duration-300 ${
                    focusedInput === 'password' ? 'text-[#6B8E7B]' : 'text-gray-400'
                  }`}
                  animate={focusedInput === 'password' ? { scale: 1.1 } : { scale: 1 }}
                >
                  <HiOutlineLockClosed className="text-xl" />
                </motion.div>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                className={`pl-12 pr-12 py-4 w-full rounded-xl 
                         bg-gray-50/50 border transition-all duration-300
                         ${focusedInput === 'password' 
                           ? 'border-[#6B8E7B] ring-1 ring-[#6B8E7B] shadow-[0_0_15px_rgba(107,142,123,0.15)]' 
                           : 'border-gray-100 hover:border-[#6B8E7B]/30'}
                         focus:outline-none`}
                placeholder="請輸入密碼"
                required
              />

              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`transition-all duration-300 ${
                    focusedInput === 'password' ? 'text-[#6B8E7B]' : 'text-gray-400'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showPassword ? <HiEyeOff className="text-xl" /> : <HiEye className="text-xl" />}
                </motion.button>
              </div>
            </motion.div>

            {/* 忘記密碼連結 */}
            <motion.div 
              className="flex justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-gray-500 hover:text-[#6B8E7B]
                         transition-colors duration-200"
              >
                忘記密碼？
              </Link>
            </motion.div>

            {/* 登入按鈕 */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 mt-4 rounded-xl text-white
                       bg-[#6B8E7B] hover:bg-[#5F7A68]
                       transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? '登入中...' : '登入'}
            </motion.button>

            {/* 註冊連結 */}
            <motion.div
              className="text-center mt-6"
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
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}