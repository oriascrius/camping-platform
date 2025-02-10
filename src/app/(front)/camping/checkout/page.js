'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { FaUser, FaPhone, FaEnvelope, FaCreditCard, FaMoneyBill, FaChevronDown, FaChevronUp, FaShoppingCart, FaUserEdit, FaExclamationCircle, FaCalendarCheck, FaCalendarTimes, FaLine } from 'react-icons/fa';
import { FaCampground, FaUsers } from 'react-icons/fa';

// ===== 自定義工具引入 =====
import { 
  showSystemAlert,     // 系統錯誤提示
  showCartAlert        // 購物車相關提示
} from "@/utils/sweetalert";

import {
  checkoutToast,      // 結帳相關提示
  ToastContainerComponent // Toast 容器組件
} from "@/utils/toast";

export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState({}); // 追蹤每個項目的展開狀態
  const [formData, setFormData] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    paymentMethod: 'credit_card'
  });

  // 錯誤訊息 state
  const [errors, setErrors] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    paymentMethod: ''
  });

  // 驗證規則
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'contactName':
        if (!value.trim()) {
          error = '請輸入姓名';
        } else if (value.length < 2) {
          error = '姓或名至少需要2個字';
        }
        break;
      
      case 'contactPhone':
        const phoneRegex = /^09\d{8}$/;
        if (!value) {
          error = '請輸入電話號碼';
        } else if (!phoneRegex.test(value)) {
          error = '請輸入有效的手機號碼 (09xxxxxxxx)';
        }
        break;
      
      case 'contactEmail':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          error = '請輸入電子信箱';
        } else if (!emailRegex.test(value)) {
          error = '請輸入有效的電子信箱格式';
        }
        break;
      
      case 'paymentMethod':
        if (!value) {
          error = '請選擇付款方式';
        }
        break;
    }
    return error;
  };

  // 處理輸入變更
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 即時驗證
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // 表單提交前驗證所有欄位
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      newErrors[key] = error;
      if (error) isValid = false;
    });

    setErrors(newErrors);
    return isValid;
  };

  // 切換展開狀態
  const toggleItem = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 直接從購物車 API 獲取資料
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const response = await fetch('/api/camping/cart');
        if (!response.ok) throw new Error('無法獲取購物車資料');
        const data = await response.json();
        setCartItems(data.cartItems);
      } catch (error) {
        console.error('獲取購物車資料失敗:', error);
        // 系統錯誤 -> 使用 SweetAlert
        await showSystemAlert.error('獲取購物車資料失敗');
        router.push('/cart');
      }
    };

    fetchCartData();
  }, []);

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // 表單驗證錯誤 -> 使用 Toast
      checkoutToast.error('請檢查並填寫正確的資料');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/camping/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cartItems,
          contactInfo: formData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 根據錯誤類型選擇提示方式
        if (data.error.includes('庫存不足') || 
            data.error.includes('已被預訂') ||
            data.error.includes('數量限制')) {
          // 一般操作錯誤 -> 使用 Toast
          checkoutToast.error(data.error);
          return;
        }

        // 系統錯誤 -> 使用 SweetAlert
        await showSystemAlert.error(data.error || '預訂失敗');
        return;
      }

      // 成功提示 -> 使用 SweetAlert（因為需要等待用戶確認）
      await showCartAlert.success('預訂成功', '您的預訂已完成');
      
      // 確保有 bookingId 才導向
      if (data.bookingIds && data.bookingIds.length > 0) {
        router.push(`/camping/checkout/complete?bookingId=${data.bookingIds[0]}`);
      } else if (data.bookingId) {  // 如果是單一 bookingId
        router.push(`/camping/checkout/complete?bookingId=${data.bookingId}`);
      } else {
        // 系統錯誤 -> 使用 SweetAlert
        await showSystemAlert.error('未收到預訂編號');
      }

    } catch (error) {
      console.error('結帳錯誤:', error);
      // 未預期的錯誤 -> 使用 SweetAlert
      await showSystemAlert.unexpectedError();
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化日期的輔助函數
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'yyyy/MM/dd');
    } catch (error) {
      console.error('日期格式錯誤:', dateString);
      return '日期格式錯誤';
    }
  };

  // 計算總金額
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.total_price, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[var(--lightest-brown)] min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[var(--tertiary-brown)]">
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：訂單摘要 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[var(--primary-brown)] flex items-center gap-2">
              <FaShoppingCart className="text-[var(--secondary-brown)]" />
              訂單資訊
            </h2>
            
            {/* 訂單項目列表 */}
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={index} className="border border-[var(--tertiary-brown)] rounded-xl overflow-hidden
                  transition-all duration-300 hover:shadow-lg">
                  {/* 可點擊的標題列 */}
                  <div
                    onClick={() => toggleItem(index)}
                    className="flex justify-between items-center p-4 
                      bg-gradient-to-r from-white to-[var(--lightest-brown)]
                      cursor-pointer hover:bg-[var(--lightest-brown)] transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--primary-brown)]">{item.activity_name}</h3>
                      <p className="text-sm text-[var(--gray-3)]">
                        {format(new Date(item.start_date), 'yyyy/MM/dd')} ~ 
                        {format(new Date(item.end_date), 'yyyy/MM/dd')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-[var(--primary-brown)] font-medium">
                        NT$ {item.total_price.toLocaleString()}
                      </span>
                      {expandedItems[index] ? 
                        <FaChevronUp className="text-[var(--secondary-brown)] transition-transform duration-300" /> : 
                        <FaChevronDown className="text-[var(--secondary-brown)] transition-transform duration-300" />
                      }
                    </div>
                  </div>

                  {/* 展開的詳細內容 */}
                  {expandedItems[index] && (
                    <div className="p-4 space-y-3 bg-white border-t border-[var(--tertiary-brown)]">
                      <div className="flex justify-between items-center p-2 hover:bg-[var(--lightest-brown)] rounded-lg transition-colors">
                        <span className="text-[var(--gray-3)] flex items-center gap-2">
                          <FaCampground className="text-[var(--secondary-brown)]" />
                          營位名稱
                        </span>
                        <span className="text-[var(--primary-brown)]">{item.spot_name}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 hover:bg-[var(--lightest-brown)] rounded-lg transition-colors">
                        <span className="text-[var(--gray-3)] flex items-center gap-2">
                          <FaUsers className="text-[var(--secondary-brown)]" />
                          數量
                        </span>
                        <span className="text-[var(--primary-brown)]">{item.quantity} 個</span>
                      </div>
                      <div className="flex justify-between items-center p-2 hover:bg-[var(--lightest-brown)] rounded-lg transition-colors">
                        <span className="text-[var(--gray-3)] flex items-center gap-2">
                          <FaCalendarCheck className="text-[var(--secondary-brown)]" />
                          入住日期
                        </span>
                        <span className="text-[var(--primary-brown)]">
                          {format(new Date(item.start_date), 'yyyy/MM/dd')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 hover:bg-[var(--lightest-brown)] rounded-lg transition-colors">
                        <span className="text-[var(--gray-3)] flex items-center gap-2">
                          <FaCalendarTimes className="text-[var(--secondary-brown)]" />
                          退房日期
                        </span>
                        <span className="text-[var(--primary-brown)]">
                          {format(new Date(item.end_date), 'yyyy/MM/dd')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 總金額 */}
            <div className="bg-gradient-to-r from-[var(--primary-brown)] to-[var(--secondary-brown)]
              p-6 rounded-xl text-white shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-xl">總金額</span>
                <span className="text-2xl font-bold">
                  NT$ {cartItems.reduce((total, item) => total + item.total_price, 0).toLocaleString()}
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
                        ${errors.contactName 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-[var(--tertiary-brown)] focus:ring-[var(--secondary-brown)] focus:border-[var(--secondary-brown)]'
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
                        ${errors.contactPhone 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-[var(--tertiary-brown)] focus:ring-[var(--secondary-brown)] focus:border-[var(--secondary-brown)]'
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
                        ${errors.contactEmail 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-[var(--tertiary-brown)] focus:ring-[var(--secondary-brown)] focus:border-[var(--secondary-brown)]'
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
                  <label className="block text-lg font-medium text-[var(--primary-brown)]">付款方式</label>
                  <div className="grid grid-cols-3 gap-4">
                    {/* 信用卡 */}
                    <label className={`flex items-center p-5 border rounded-xl cursor-pointer
                      transition-all duration-300
                      ${formData.paymentMethod === 'credit_card' 
                        ? 'border-[var(--primary-brown)] bg-[var(--lightest-brown)]' 
                        : 'border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:bg-[var(--lightest-brown)]'
                      }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={formData.paymentMethod === 'credit_card'}
                        onChange={handleInputChange}
                        className="w-5 h-5 mr-4 text-[var(--primary-brown)]"
                      />
                      <FaCreditCard className="text-xl mr-3 text-[var(--secondary-brown)]" />
                      <span className="text-lg">信用卡</span>
                    </label>

                    {/* LINE Pay */}
                    <label className={`flex items-center p-5 border rounded-xl cursor-pointer
                      transition-all duration-300
                      ${formData.paymentMethod === 'line_pay' 
                        ? 'border-[var(--primary-brown)] bg-[var(--lightest-brown)]' 
                        : 'border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:bg-[var(--lightest-brown)]'
                      }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="line_pay"
                        checked={formData.paymentMethod === 'line_pay'}
                        onChange={handleInputChange}
                        className="w-5 h-5 mr-4 text-[var(--primary-brown)]"
                      />
                      <FaLine className="text-xl mr-3 text-[#06C755]" />
                      <span className="text-lg">LINE Pay</span>
                    </label>

                    {/* 銀行轉帳 */}
                    <label className={`flex items-center p-5 border rounded-xl cursor-pointer
                      transition-all duration-300
                      ${formData.paymentMethod === 'transfer' 
                        ? 'border-[var(--primary-brown)] bg-[var(--lightest-brown)]' 
                        : 'border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:bg-[var(--lightest-brown)]'
                      }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={handleInputChange}
                        className="w-5 h-5 mr-4 text-[var(--primary-brown)]"
                      />
                      <FaMoneyBill className="text-xl mr-3 text-[var(--secondary-brown)]" />
                      <span className="text-lg">銀行轉帳</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 送出按鈕 */}
              <button
                type="submit"
                disabled={isLoading || Object.values(errors).some(error => error)}
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
                ) : '確認付款'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <ToastContainerComponent />
    </div>
  );
} 