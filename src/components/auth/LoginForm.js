'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { signIn } from 'next-auth/react';

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (response.error) {
        toast.error('登入失敗：帳號或密碼錯誤', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          style: {
            fontSize: '16px',
            fontWeight: '500',
            borderRadius: '10px',
            padding: '16px 24px',
          }
        });
        return;
      }

      toast.success('登入成功！', {
        position: "top-center",
        autoClose: 500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        style: {
          fontSize: '16px',
          fontWeight: '500',
          borderRadius: '10px',
          padding: '16px 24px',
        },
        onClose: () => {
          setTimeout(() => {
            const previousPage = document.referrer;
            if (previousPage && !previousPage.includes('/auth/')) {
              router.back();
            } else {
              router.push('/');
            }
          }, 500);
        }
      });

    } catch (error) {
      console.error('登入錯誤:', error);
      toast.error('登入過程發生錯誤', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        style: {
          fontSize: '16px',
          fontWeight: '500',
          borderRadius: '10px',
          padding: '16px 24px',
        }
      });
    } finally {
      setLoading(false);
    }
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
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {loading ? '登入中...' : '登入'}
      </button>
    </form>
  );
}