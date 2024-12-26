import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "露營探索家 | Camp Explorer",
  description: "尋找最佳露營地點，分享露營體驗，預訂營地的一站式平台",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

