'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast } from 'react-toastify';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut({ 
          redirect: false,
          callbackUrl: '/'
        });

        toast.success('登出成功！', {
          position: "top-center",
          autoClose: 1500,
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

        // 延遲跳轉，讓用戶看到提示
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);

      } catch (error) {
        console.error('登出錯誤:', error);
        toast.error('登出過程發生錯誤', {
          position: "top-center",
          autoClose: 3000,
        });
      }
    };

    handleLogout();
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        正在為您登出...
      </h1>
      <p className="text-gray-600">
        感謝您的使用，期待再次見到您！
      </p>
      <button
        onClick={() => router.push('/')}
        className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        返回首頁
      </button>
    </div>
  );
} 