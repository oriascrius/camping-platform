import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClientSideNav from "@/components/layout/ClientSideNav";
import pool from "@/lib/db";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { Toaster } from 'react-hot-toast';
import ChatIcon from '@/components/Chat/ChatIcon';
// import 'react-datepicker/dist/react-datepicker.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "露營探索家 | Camp Explorer",
  description: "尋找最佳露營地點，分享露營體驗，預訂營地的一站式平台",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <Providers>
          <ClientSideNav />
          <CartSidebar />
          <header className="relative bg-white">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
              {children}
            </main>
          </header>
          <ToastContainer
            position="top-center"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Toaster position="top-center" />
          <footer className="bg-gray-100 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-gray-600">
                <p>© 2024 露營探索家. All rights reserved.</p>
              </div>
            </div>
          </footer>
          <ChatIcon />
        </Providers>
      </body>
    </html>
  );
}

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          露營探索家
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
