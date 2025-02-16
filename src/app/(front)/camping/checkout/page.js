"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaCreditCard,
  FaMoneyBill,
  FaShoppingCart,
  FaUserEdit,
  FaExclamationCircle,
  FaLine,
  FaCheckCircle,
  FaCheck,
} from "react-icons/fa";
import { motion } from "framer-motion";
import Link from "next/link";

// ===== 自定義工具引入 =====
import {
  showSystemAlert, // 系統錯誤提示
} from "@/utils/sweetalert";

import {
  checkoutToast, // 結帳相關提示
  ToastContainerComponent, // Toast 容器組件
} from "@/utils/toast";

// 在檔案開頭加入步驟定義
const STEPS = [
  {
    id: 1,
    label: "確認購物車",
    subLabel: "已完成",
    icon: FaShoppingCart,
    description: "檢視並確認您的營位選擇",
  },
  {
    id: 2,
    label: "填寫資料",
    subLabel: "當前",
    icon: FaUser,
    description: "填寫聯絡人與預訂資訊",
  },
  {
    id: 3,
    label: "完成預訂",
    subLabel: "下一步",
    icon: FaCheckCircle,
    description: "確認訂單並完成預訂",
  },
];

// 在 import 區塊下方添加這個輔助函數
const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState({}); // 追蹤每個項目的展開狀態
  const [formData, setFormData] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    paymentMethod: "cash", // 改為預設使用現金付款
  });

  // 錯誤訊息 state
  const [errors, setErrors] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    paymentMethod: "",
  });

  // const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [paymentUrls, setPaymentUrls] = useState({
    web: "",
    app: "",
  });

  // 付款方式狀態
  // const [paymentMethod, setPaymentMethod] = useState("");

  // 驗證規則
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "contactName":
        if (!value.trim()) {
          error = "請輸入姓名";
        } else if (value.length < 2) {
          error = "姓或名至少需要2個字";
        }
        break;

      case "contactPhone":
        const phoneRegex = /^09\d{8}$/;
        if (!value) {
          error = "請輸入電話號碼";
        } else if (!phoneRegex.test(value)) {
          error = "請輸入有效的手機號碼 (09xxxxxxxx)";
        }
        break;

      case "contactEmail":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          error = "請輸入電子信箱";
        } else if (!emailRegex.test(value)) {
          error = "請輸入有效的電子信箱格式";
        }
        break;

      case "paymentMethod":
        if (!value) {
          error = "請選擇付款方式";
        }
        break;
    }
    return error;
  };

  // 處理輸入變更
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 即時驗證
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // 表單提交前驗證所有欄位
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      newErrors[key] = error;
      if (error) isValid = false;
    });

    setErrors(newErrors);
    return isValid;
  };

  // 切換展開狀態
  const toggleItem = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // 直接從購物車 API 獲取資料
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const response = await fetch("/api/camping/cart");
        if (!response.ok) throw new Error("無法獲取購物車資料");
        const data = await response.json();
        setCartItems(data.cartItems);
      } catch (error) {
        console.error("獲取購物車資料失敗:", error);
        // 系統錯誤 -> 使用 SweetAlert
        await showSystemAlert.error("獲取購物車資料失敗");
        router.push("/cart");
      }
    };

    fetchCartData();
  }, []);

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);

      // 檢查購物車項目
      if (!cartItems || cartItems.length === 0) {
        checkoutToast.error('購物車是空的');
        return;
      }

      // 驗證聯絡資訊
      if (!formData.contactName?.trim()) {
        checkoutToast.error('請填寫聯絡人姓名');
        return;
      }
      if (!formData.contactPhone?.trim()) {
        checkoutToast.error('請填寫聯絡電話');
        return;
      }
      if (!formData.contactEmail?.trim()) {
        checkoutToast.error('請填寫電子郵件');
        return;
      }

      // 準備請求資料
      const requestData = {
        cartItems: cartItems.map(item => ({
          option_id: item.option_id,
          quantity: item.quantity,
          start_date: item.start_date,
          end_date: item.end_date,
          price: item.price
        })),
        totalAmount: cartItems.reduce((total, item) => total + item.total_price, 0),
        contactInfo: {
          contactName: formData.contactName.trim(),
          contactPhone: formData.contactPhone.trim(),
          contactEmail: formData.contactEmail.trim()
        }
      };

      // 發送 LINE Pay 請求
      const linePayResponse = await fetch('/api/camping/payment/line-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await linePayResponse.json();

      if (!linePayResponse.ok) {
        throw new Error(responseData.error || 'LINE Pay 請求失敗');
      }

      // 如果成功，重定向到 LINE Pay 付款頁面
      if (responseData.paymentUrl) {
        window.location.href = responseData.paymentUrl;
      } else {
        throw new Error('未收到付款連結');
      }

    } catch (error) {
      console.error('處理失敗:', error);
      checkoutToast.error(error.message || 'LINE Pay 處理失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化日期的輔助函數
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), "yyyy/MM/dd");
    } catch (error) {
      console.error("日期格式錯誤:", dateString);
      return "日期格式錯誤";
    }
  };

  // 計算總金額
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.total_price, 0);
  };

  useEffect(() => {
    // 監聽來自付款視窗的訊息
    const handleMessage = (event) => {
      if (event.data === "LINE_PAY_SUCCESS") {
        // 付款成功，導向訂單頁面
        router.push("/member/purchase-history");
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [router]);

  const handlePayment = async () => {
    try {
      if (formData.paymentMethod === "line_pay") {
        const response = await fetch("/api/camping/payment/line-pay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cartItems,
            amount: calculateTotal(),
            contactInfo: formData,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // 使用新視窗開啟 LINE Pay
          window.open(
            result.paymentUrl,
            "LINE_PAY_WINDOW",
            "width=800,height=800"
          );
        } else {
          throw new Error(result.error || "付款發生錯誤");
        }
      } else {
        // 其他付款方式的處理...
        handleSubmit(e);
      }
    } catch (error) {
      console.error("付款處理失敗:", error);
      alert("付款處理失敗: " + error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[var(--lightest-brown)] min-h-screen">
      {/* 步驟進度條 */}
      <div className="mb-16 relative z-0">
        <div className="relative flex justify-between max-w-4xl mx-auto">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              className="flex flex-col items-center relative z-0 group w-full"
            >
              {/* 連接線 */}
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
                      step.id <= 2
                        ? "bg-[var(--primary-brown)] border-[var(--primary-brown)]"
                        : "bg-[var(--tertiary-brown)] border-[var(--tertiary-brown)]"
                    }
                    transition-colors duration-300`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                >
                  {/* 步驟圖示 */}
                  {step.id === 1 ? (
                    <FaCheck className="w-5 h-5 text-white" />
                  ) : step.id === 2 ? (
                    <step.icon className="w-5 h-5 text-white" />
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
                    step.id <= 2
                      ? "text-[var(--primary-brown)]"
                      : "text-[var(--gray-3)]"
                  }`}
                >
                  {step.label}
                </span>
                {step.subLabel && (
                  <span className="text-sm text-[var(--gray-4)]">
                    {step.subLabel}
                  </span>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[var(--tertiary-brown)]">
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：訂單摘要 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[var(--primary-brown)] flex items-center gap-2">
              <FaShoppingCart className="text-[var(--secondary-brown)]" />
              訂單資訊
            </h2>

            {/* 商品小計列表 */}
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <Link
                  key={index}
                  href={`/camping/activities/${item.activity_id}`}
                  className="block no-underline hover:no-underline"
                >
                  <div className="grid grid-cols-12 items-center p-3 rounded-lg hover:bg-[var(--gray-7)] transition-colors duration-300">
                    {/* 商品名稱和詳細資訊 */}
                    <div className="col-span-6">
                      <span className="font-bold text-[var(--gray-1)]">
                        {item.activity_name}
                      </span>
                      {/* 添加小字資訊 */}
                      <div className="text-sm text-[var(--gray-3)] mt-1">
                        {calculateDays(item.start_date, item.end_date)} 晚 ×{" "}
                        {item.quantity} 營位
                      </div>
                    </div>
                    {/* 價格計算明細 */}
                    <div className="col-span-4 text-right text-sm text-[var(--gray-3)]">
                      NT$ {Number(item.unit_price).toLocaleString()} ×
                      {calculateDays(item.start_date, item.end_date)} 晚 ×
                      {item.quantity} 營位
                    </div>
                    {/* 小計金額 */}
                    <div className="col-span-2 text-right text-[var(--primary-brown)]">
                      NT$ {Number(item.total_price).toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* 總金額 */}
            <div
              className="bg-gradient-to-r from-[var(--primary-brown)] to-[var(--secondary-brown)]
              p-6 rounded-xl text-white shadow-lg"
            >
              <div className="flex justify-between items-center">
                <span className="text-xl">總金額</span>
                <span className="text-2xl font-bold">
                  NT${" "}
                  {cartItems
                    .reduce((total, item) => total + item.total_price, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 右側：聯絡資訊表單 */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[var(--primary-brown)] flex items-center gap-2">
              <FaUserEdit className="text-[var(--secondary-brown)]" />
              聯絡資訊
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                {/* 姓名輸入 */}
                <div className="space-y-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaUser className="text-[var(--secondary-brown)] text-xl" />
                    </div>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      placeholder="聯絡人姓名"
                      className={`pl-12 w-full rounded-xl border text-lg py-4
                        transition-all duration-300
                        ${
                          errors.contactName
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-[var(--tertiary-brown)] focus:ring-[var(--secondary-brown)] focus:border-[var(--secondary-brown)]"
                        }`}
                    />
                  </div>
                  {errors.contactName && (
                    <p className="text-red-500 text-sm ml-1 flex items-center gap-1">
                      <FaExclamationCircle />
                      {errors.contactName}
                    </p>
                  )}
                </div>

                {/* 電話輸入 */}
                <div className="space-y-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaPhone className="text-[var(--secondary-brown)] text-xl" />
                    </div>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      placeholder="聯絡電話"
                      className={`pl-12 w-full rounded-xl border text-lg py-4
                        transition-all duration-300
                        ${
                          errors.contactPhone
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-[var(--tertiary-brown)] focus:ring-[var(--secondary-brown)] focus:border-[var(--secondary-brown)]"
                        }`}
                    />
                  </div>
                  {errors.contactPhone && (
                    <p className="text-red-500 text-sm ml-1 flex items-center gap-1">
                      <FaExclamationCircle />
                      {errors.contactPhone}
                    </p>
                  )}
                </div>

                {/* 信箱輸入 */}
                <div className="space-y-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope className="text-[var(--secondary-brown)] text-xl" />
                    </div>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder="電子信箱"
                      className={`pl-12 w-full rounded-xl border text-lg py-4
                        transition-all duration-300
                        ${
                          errors.contactEmail
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-[var(--tertiary-brown)] focus:ring-[var(--secondary-brown)] focus:border-[var(--secondary-brown)]"
                        }`}
                    />
                  </div>
                  {errors.contactEmail && (
                    <p className="text-red-500 text-sm ml-1 flex items-center gap-1">
                      <FaExclamationCircle />
                      {errors.contactEmail}
                    </p>
                  )}
                </div>

                {/* 付款方式 */}
                <div className="space-y-4">
                  <label className="block text-lg font-medium text-[var(--primary-brown)]">
                    付款方式
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 現金付款選項 */}
                    <div
                      className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300
                        ${
                          formData.paymentMethod === "cash"
                            ? "border-[var(--primary-brown)] bg-gradient-to-br from-white to-[var(--lightest-brown)] shadow-md transform scale-[1.02]"
                            : "border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:shadow-sm"
                        }`}
                      onClick={() =>
                        handleInputChange({
                          target: { name: "paymentMethod", value: "cash" },
                        })
                      }
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === "cash"}
                        onChange={handleInputChange}
                        className="absolute opacity-0"
                      />
                      {formData.paymentMethod === "cash" && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--primary-brown)] rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`flex flex-col items-center justify-center gap-2 py-3
                        ${
                          formData.paymentMethod === "cash"
                            ? "transform scale-105"
                            : ""
                        }`}
                      >
                        <FaMoneyBill
                          className={`text-3xl transition-colors duration-300
                          ${
                            formData.paymentMethod === "cash"
                              ? "text-[var(--primary-brown)]"
                              : "text-[var(--secondary-brown)]"
                          }`}
                        />
                        <span
                          className={`text-lg font-medium transition-colors duration-300
                          ${
                            formData.paymentMethod === "cash"
                              ? "text-[var(--primary-brown)]"
                              : "text-[var(--gray-3)]"
                          }`}
                        >
                          現場付款
                        </span>
                      </div>
                    </div>

                    {/* LINE Pay */}
                    <div
                      className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300
                        ${
                          formData.paymentMethod === "line_pay"
                            ? "border-[var(--primary-brown)] bg-gradient-to-br from-white to-[var(--lightest-brown)] shadow-md transform scale-[1.02]"
                            : "border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:shadow-sm"
                        }`}
                      onClick={() =>
                        handleInputChange({
                          target: { name: "paymentMethod", value: "line_pay" },
                        })
                      }
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="line_pay"
                        checked={formData.paymentMethod === "line_pay"}
                        onChange={handleInputChange}
                        className="absolute opacity-0"
                      />
                      {formData.paymentMethod === "line_pay" && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--primary-brown)] rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`flex flex-col items-center justify-center gap-2 py-3
                        ${
                          formData.paymentMethod === "line_pay"
                            ? "transform scale-105"
                            : ""
                        }`}
                      >
                        <FaLine
                          className={`text-3xl transition-colors duration-300
                          ${
                            formData.paymentMethod === "line_pay"
                              ? "text-[#06C755]"
                              : "text-[#06C755] opacity-70"
                          }`}
                        />
                        <span
                          className={`text-lg font-medium transition-colors duration-300
                          ${
                            formData.paymentMethod === "line_pay"
                              ? "text-[var(--primary-brown)]"
                              : "text-[var(--gray-3)]"
                          }`}
                        >
                          LINE Pay
                        </span>
                      </div>
                    </div>

                    {/* 綠界支付 */}
                    <div
                      className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300
                        ${
                          formData.paymentMethod === "ecpay"
                            ? "border-[var(--primary-brown)] bg-gradient-to-br from-white to-[var(--lightest-brown)] shadow-md transform scale-[1.02]"
                            : "border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:shadow-sm"
                        }`}
                      onClick={() =>
                        handleInputChange({
                          target: { name: "paymentMethod", value: "ecpay" },
                        })
                      }
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ecpay"
                        checked={formData.paymentMethod === "ecpay"}
                        onChange={handleInputChange}
                        className="absolute opacity-0"
                      />
                      {formData.paymentMethod === "ecpay" && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--primary-brown)] rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`flex flex-col items-center justify-center gap-2 py-3
                        ${
                          formData.paymentMethod === "ecpay"
                            ? "transform scale-105"
                            : ""
                        }`}
                      >
                        <FaCreditCard
                          className={`text-3xl transition-colors duration-300
                          ${
                            formData.paymentMethod === "ecpay"
                              ? "text-[var(--primary-brown)]"
                              : "text-[var(--secondary-brown)]"
                          }`}
                        />
                        <span
                          className={`text-lg font-medium transition-colors duration-300
                          ${
                            formData.paymentMethod === "ecpay"
                              ? "text-[var(--primary-brown)]"
                              : "text-[var(--gray-3)]"
                          }`}
                        >
                          綠界支付
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 送出按鈕 */}
              <button
                type="submit"
                disabled={
                  isLoading || Object.values(errors).some((error) => error)
                }
                className="w-full bg-gradient-to-r from-[var(--primary-brown)] to-[var(--secondary-brown)]
                  text-white py-4 px-6 rounded-xl
                  hover:from-[var(--secondary-brown)] hover:to-[var(--primary-brown)]
                  disabled:opacity-50 disabled:cursor-not-allowed 
                  transition-all duration-300 text-lg font-medium mt-8
                  transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    處理中...
                  </span>
                ) : (
                  "確認付款"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <ToastContainerComponent />
      {paymentUrls.web && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-center">選擇付款方式</h3>
            <div className="flex flex-col gap-4">
              <button
                onClick={handlePayment}
                className="bg-green-500 text-white py-2 px-4 rounded text-center hover:bg-green-600"
              >
                前往 LINE Pay 付款
              </button>

              <button
                onClick={() => setPaymentUrls({ web: "", app: "" })}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
