"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  FaCheckCircle,
  FaCreditCard,
  FaMoneyBill,
  FaLine,
  FaFileAlt,
  FaUser,
  FaCampground,
  FaCalendar,
  FaUsers,
  FaClock,
  FaChevronDown,
  FaShoppingCart,
  FaCheck,
} from "react-icons/fa";
import { motion } from "framer-motion";
import Link from "next/link";

// ===== 自定義工具引入 =====
import {
  checkoutToast, // 結帳相關提示
  ToastContainerComponent, // Toast 容器組件
} from "@/utils/toast";

// 狀態對應的中文和顏色配置
const STATUS_MAP = {
  pending: { text: "待確認", color: "text-yellow-600" },
  confirmed: { text: "已確認", color: "text-green-600" },
  cancelled: { text: "已取消", color: "text-red-600" },
};

const PAYMENT_STATUS_MAP = {
  pending: { text: "待付款", color: "text-yellow-600" },
  paid: { text: "已付款", color: "text-green-600" },
  failed: { text: "付款失敗", color: "text-red-600" },
  refunded: { text: "已退款", color: "text-gray-600" },
};

// 更新支付方式對應圖示
const PAYMENT_METHOD_MAP = {
  ecpay: {
    icon: FaCreditCard,
    text: "綠界支付",
    color: "text-blue-600",
  },
  line_pay: {
    icon: FaLine,
    text: "LINE Pay",
    color: "text-[#06C755]",
  },
  cash: {
    icon: FaMoneyBill,
    text: "現場付款",
    color: "text-green-600",
  },
};

// 計算天數的輔助函數
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// 在檔案開頭加入步驟定義
const STEPS = [
  {
    id: 1,
    label: "確認購物車",
    subLabel: "已完成",
    icon: FaShoppingCart,
    description: "檢視並確認您的營位選擇",
    className: "z-0",
  },
  {
    id: 2,
    label: "填寫資料",
    subLabel: "已完成",
    icon: FaUser,
    description: "填寫聯絡人與預訂資訊",
    className: "z-0",
  },
  {
    id: 3,
    label: "完成預訂",
    subLabel: "當前",
    icon: FaCheckCircle,
    description: "確認訂單並完成預訂",
    className: "z-0",
  },
];

if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    // 過濾掉 AbortError 相關的錯誤
    if (
      args[0]?.includes?.('Fetch request failed: AbortError') ||
      args[0]?.message?.includes?.('AbortError') ||
      args[0]?.includes?.('signal is aborted')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export default function OrderCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const orderId = searchParams.get("orderId");
  // 修改摺疊狀態的預設值，全部預設為收合
  const [expandedSections, setExpandedSections] = useState({
    orderInfo: false,
    contactInfo: false,
    bookingItems: false,
  });

  // 切換摺疊狀態的函數
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    const hasNotified = localStorage.getItem(`notified_${orderId}`);
    let isSubscribed = true;  // 追蹤組件是否還在掛載
    
    if (!orderId) return;

    // 定義一個非同步函數來處理所有的 fetch 操作
    const handleOrderData = async () => {
      try {
        // 獲取訂單資料
        const response = await fetch(`/api/camping/checkout/complete?orderId=${orderId}`);
        
        if (!response.ok) {
          throw new Error('訂單資料獲取失敗');
        }

        const data = await response.json();
        
        // 檢查組件是否還在掛載
        if (!isSubscribed) return;
        
        setOrderData(data);
        
        // 只在未通知過時發送 LINE 通知
        if (!hasNotified) {
          localStorage.setItem(`notified_${orderId}`, 'true');
          
          await fetch(`/api/camping/line-order-notification/${orderId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }

        // 觸發購物車更新
        window.dispatchEvent(new Event('cartUpdate'));

        // Toast 提示
        if (data.status === "cancelled") {
          checkoutToast.error("訂單已取消");
        } else if (data.payment_status === "pending" && data.payment_method !== "cash") {
          checkoutToast.warning("請盡快完成付款程序");
        } else if (data.payment_method === "cash") {
          checkoutToast.info("請記得到現場付款");
        } else if (data.status === "confirmed") {
          checkoutToast.success("訂單已確認成功！");
        }

      } catch (error) {
        if (isSubscribed) {
          console.error("處理失敗:", error);
          checkoutToast.error("發生未預期的錯誤");
          router.push('/member/purchase-history');
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    handleOrderData();

    // 清理函數
    return () => {
      isSubscribed = false;
    };
  }, [orderId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-[var(--lightest-brown)] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg 
                className="w-24 h-24 mx-auto text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </motion.div>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            找不到訂單資料
          </h2>
          <p className="text-gray-600 mb-8">
            您的訂單資料可能已過期或不存在，請重新進行預訂。
          </p>
          
          <div className="space-y-3">
            <Link 
              href="/camping/activities"
              className="no-underline block w-full bg-[var(--primary-brown)] text-white py-3 px-6 rounded-lg hover:bg-[var(--secondary-brown)] transition-colors duration-300"
            >
              瀏覽營地活動
            </Link>
            <Link 
              href="/"
              className="no-underline block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-300"
            >
              返回首頁
            </Link>
          </div> 
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* 步驟進度條 */}
        <div className="mb-16 relative z-0">
          <div className="relative flex justify-between max-w-4xl mx-auto">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.id}
                className="flex flex-col items-center relative z-0 group w-full"
              >
                {/* 連接線 - 降低 z-index */}
                {index < STEPS.length - 1 && (
                  <div className="absolute h-[5px] top-[18px] left-[calc(50%+20px)] right-[calc(-50%+20px)] bg-[var(--tertiary-brown)] -z-10">
                    {step.id <= 2 && (
                      <>
                        {/* 基礎流動效果 */}
                        <motion.div
                          className="absolute top-0 left-0 h-full w-full -z-10"
                          style={{
                            background:
                              "linear-gradient(90deg, var(--primary-brown) 0%, var(--secondary-brown) 50%, var(--primary-brown) 100%)",
                            backgroundSize: "200% 100%",
                            opacity: 0.8,
                          }}
                          animate={{
                            backgroundPosition: ["0% 0%", "100% 0%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        {/* 光點流動效果 */}
                        <motion.div
                          className="absolute top-0 left-0 h-full w-[30px] -z-10"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, var(--primary-brown) 50%, transparent 100%)",
                            opacity: 0.9,
                          }}
                          animate={{
                            x: ["-100%", "400%"],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* 步驟圓圈 */}
                <div className="relative z-10">
                  <motion.div
                    className={`w-10 h-10 rounded-full border-[4px] flex items-center justify-center
                      ${
                        step.id <= 3
                          ? "bg-[var(--primary-brown)] border-[var(--primary-brown)]"
                          : "bg-[var(--tertiary-brown)] border-[var(--tertiary-brown)]"
                      }
                      transition-colors duration-300 relative`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    {step.id <= 3 ? (
                      <FaCheck className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-sm font-medium text-[var(--gray-4)]">
                        {step.id}
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* 步驟文字 */}
                <motion.div
                  className="mt-4 text-center relative z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <span
                    className={`block text-base font-medium
                    ${
                      step.id <= 3
                        ? "text-[var(--primary-brown)]"
                        : "text-[var(--gray-3)]"
                    }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 訂單完成圖示和標題 */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div
              className="w-20 h-20 rounded-full bg-[var(--primary-brown)] 
              flex items-center justify-center mx-auto"
            >
              <FaCheckCircle className="text-white text-4xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--primary-brown)] mb-2 m-0">
            訂單完成
          </h1>
          <p className="text-[var(--gray-3)] m-0">
            訂單編號：
            <span className="text-[var(--primary-brown)]">
              {orderData?.order_id || "0"}
            </span>
          </p>
        </div>

        {/* 主要按鈕區 - 修改 hover 效果 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => router.push("/")}
            className="group w-full py-2 px-4 text-[var(--primary-brown)] 
              border-2 border-[var(--primary-brown)] rounded-lg 
              hover:bg-[var(--secondary-brown)] hover:text-white
              transition-all duration-300 ease-in-out"
          >
            <span className="font-medium m-0">回到首頁</span>
          </button>
          <button
            onClick={() => router.push("/member/purchase-history")}
            className="w-full py-2 px-4 bg-[var(--primary-brown)] text-white 
              rounded-lg hover:bg-[var(--secondary-brown)] transition-colors duration-300"
          >
            <span className="font-medium m-0">查看訂單</span>
          </button>
        </div>

        {/* 折疊式資訊區 - 增加間距 */}
        <div className="space-y-6">
          {/* 訂單資訊 */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection("orderInfo")}
              className="w-full px-6 py-2 flex justify-between items-center text-left
                hover:bg-[var(--lightest-brown)] transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-[var(--primary-brown)]" />
                <span className="text-lg font-medium m-0">訂單資訊</span>
              </div>
              <div
                className={`transform transition-transform duration-300 
                ${expandedSections.orderInfo ? "rotate-180" : "rotate-0"}`}
              >
                <FaChevronDown />
              </div>
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden
              ${
                expandedSections.orderInfo
                  ? "max-h-[500px] opacity-100 py-6"
                  : "max-h-0 opacity-0 py-0"
              }`}
            >
              <div className="px-6">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="訂單日期"
                    value={format(
                      new Date(orderData.created_at),
                      "yyyy/MM/dd HH:mm"
                    )}
                  />
                  <InfoItem
                    label="付款方式"
                    value={PAYMENT_METHOD_MAP[orderData.payment_method]?.text}
                    icon={PAYMENT_METHOD_MAP[orderData.payment_method]?.icon}
                    color={PAYMENT_METHOD_MAP[orderData.payment_method]?.color}
                  />
                  <InfoItem
                    label="訂單狀態"
                    value={STATUS_MAP[orderData.status]?.text}
                    color={STATUS_MAP[orderData.status]?.color}
                  />
                  <InfoItem
                    label="付款狀態"
                    value={PAYMENT_STATUS_MAP[orderData.payment_status]?.text}
                    color={PAYMENT_STATUS_MAP[orderData.payment_status]?.color}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 聯絡人資訊 */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection("contactInfo")}
              className="w-full px-6 py-2 flex justify-between items-center text-left
                hover:bg-[var(--lightest-brown)] transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <FaUser className="text-[var(--primary-brown)]" />
                <span className="text-lg font-medium m-0">聯絡人資訊</span>
              </div>
              <div
                className={`transform transition-transform duration-300 
                ${expandedSections.contactInfo ? "rotate-180" : "rotate-0"}`}
              >
                <FaChevronDown />
              </div>
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden
              ${
                expandedSections.contactInfo
                  ? "max-h-[500px] opacity-100 py-6"
                  : "max-h-0 opacity-0 py-0"
              }`}
            >
              <div className="px-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-4 rounded-lg bg-[var(--lightest-brown)]">
                    <p className="text-[var(--gray-3)] text-sm mb-2 m-0">
                      姓名
                    </p>
                    <p className="text-[#AC7654] font-medium m-0">
                      {orderData.contact_name}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--lightest-brown)]">
                    <p className="text-[var(--gray-3)] text-sm mb-2 m-0">
                      電話
                    </p>
                    <p className="text-[#AC7654] font-medium m-0">
                      {orderData.contact_phone}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--lightest-brown)]">
                    <p className="text-[var(--gray-3)] text-sm mb-2 m-0">
                      電子信箱
                    </p>
                    <p className="text-[#AC7654] font-medium m-0">
                      {orderData.contact_email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 預訂項目 */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection("bookingItems")}
              className="w-full px-6 py-2 flex justify-between items-center text-left
                hover:bg-[var(--lightest-brown)] transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <FaCampground className="text-[var(--primary-brown)]" />
                <span className="text-lg font-medium m-0">預訂項目</span>
              </div>
              <div
                className={`transform transition-transform duration-300 
                ${expandedSections.bookingItems ? "rotate-180" : "rotate-0"}`}
              >
                <FaChevronDown />
              </div>
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden
              ${
                expandedSections.bookingItems
                  ? "max-h-[1000px] opacity-100 py-6"
                  : "max-h-0 opacity-0 py-0"
              }`}
            >
              <div className="px-6">
                <div className="space-y-4">
                  {orderData.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-[var(--lightest-brown)]"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-[var(--primary-brown)] mb-2">
                            {item.activity_name}
                          </h3>
                          <p className="text-[var(--secondary-brown)]">
                            {item.spot_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[var(--primary-brown)] m-0">
                            NT$ {Math.round(item.unit_price).toLocaleString()}
                          </p>
                          <p className="text-sm text-[var(--gray-3)] m-0">
                            / 每晚
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <BookingDetail
                          icon={FaCalendar}
                          label="入住"
                          value={format(
                            new Date(item.start_date),
                            "yyyy/MM/dd"
                          )}
                        />
                        <BookingDetail
                          icon={FaCalendar}
                          label="退房"
                          value={format(new Date(item.end_date), "yyyy/MM/dd")}
                        />
                        <BookingDetail
                          icon={FaUsers}
                          label="數量"
                          value={`${item.quantity} 個`}
                        />
                        <BookingDetail
                          icon={FaClock}
                          label="住宿天數"
                          value={`${calculateDays(
                            item.start_date,
                            item.end_date
                          )} 晚`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 總金額 */}
                <div className="mt-6 pt-4 border-t border-[var(--tertiary-brown)]">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-[var(--primary-brown)] m-0">
                      總金額
                    </span>
                    <span className="text-2xl font-bold text-[var(--primary-brown)] m-0">
                      NT$ {Math.round(orderData.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainerComponent />
    </div>
  );
}

// 資訊項目元件
const InfoItem = ({ label, value, icon: Icon, color }) => (
  <div className="flex flex-col">
    <span className="text-[var(--gray-3)] text-sm mb-1">{label}</span>
    <div className="flex items-center gap-2">
      {Icon && <Icon className={`${color || 'text-[var(--primary-brown)]'}`} />}
      <span className={`font-medium ${color || 'text-[var(--primary-brown)]'}`}>
        {value}
      </span>
    </div>
  </div>
);

// 預訂詳情元件
const BookingDetail = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 text-[var(--gray-3)]">
    <Icon className="text-[var(--secondary-brown)]" />
    <span className="m-0">
      {label}：{value}
    </span>
  </div>
);
