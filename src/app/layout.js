import { Inter } from "next/font/google";
import { Ubuntu } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

// 設定 Ubuntu 字體
const ubuntu = Ubuntu({ 
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-ubuntu',
  display: 'swap',
});

// 設定 Gen Jyuu Gothic 本地字體
const genJyuuGothic = localFont({
  src: [
    {
      path: '../../public/fonts/GenJyuuGothic-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/GenJyuuGothic-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/GenJyuuGothic-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-genjyuu'
});

export const metadata = {
  title: "露營探索家 | Camp Explorer",
  description: "尋找最佳露營地點，分享露營體驗，預訂營地的一站式平台",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW" className={`${ubuntu.variable} ${genJyuuGothic.variable}`} suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

