'use client';
import { signIn, getSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result.error) {
        toast.error('登入失敗，請檢查帳號密碼');
        setIsLoading(false);
        return;
      }

      // 直接使用 result.ok 來判斷登入成功
      if (result.ok) {
        // 立即獲取最新的 session
        const session = await getSession();
        console.log('Current Session:', session);

        if (session?.user?.isOwner) {
          toast.success('營主登入成功');
          // 使用 replace 而不是 push
          await router.replace('/owner');
        } else if (session?.user?.isAdmin) {
          toast.success('管理員登入成功');
          await router.replace('/admin');
        } else {
          toast.success('登入成功');
          await router.replace('/');
        }
      }

    } catch (error) {
      console.error('登入錯誤:', error);
      toast.error('登入過程發生錯誤');
    } finally {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          電子郵件
        </label>
        <input
          type="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          autoComplete="username"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          密碼
        </label>
        <input
          type="password"
          name="password"
          required
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link href="/auth/register" className="text-green-600 hover:text-green-500">
            還沒有帳號？立即註冊
          </Link>
        </div>
        <div className="text-sm">
          <Link href="/auth/forgot-password" className="text-green-600 hover:text-green-500">
            忘記密碼？
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {isLoading ? '登入中...' : '登入'}
      </button>
    </form>
  );
}