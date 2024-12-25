'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
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
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      // 登入成功後獲取 session
      const session = await fetch('/api/auth/session').then(res => res.json());
      
      // 根據角色重定向
      if (session?.user?.role === 'admin' || session?.user?.role === 'super_admin') {
        // 如果是管理員，導向後台
        router.push('/admin');
        toast.success('管理員登入成功！');
      } else {
        // 如果是一般會員，導向首頁
        router.push('/');
        toast.success('登入成功！');
      }

    } catch (error) {
      console.error('登入錯誤:', error);
      toast.error('登入失敗，請稍後再試');
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