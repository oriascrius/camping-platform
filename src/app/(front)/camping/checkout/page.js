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

  // const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [paymentUrls, setPaymentUrls] = useState({
    web: '',
    app: ''
  });

  // 付款方式狀態
  const [paymentMethod, setPaymentMethod] = useState('');

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
      checkoutToast.error('請檢查並填寫正確的資料');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/camping/payment/line-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems,
          amount: calculateTotal(),
          contactInfo: formData
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'LINE Pay 請求失敗');
      }

      // 顯示 QR Code 和付款選項
      if (data.success && data.paymentUrl) {
        setPaymentUrls({
          web: data.paymentUrl,
          app: data.appPaymentUrl
        });
        return;
      }

      throw new Error('未收到付款網址');

    } catch (error) {
      console.error('付款處理失敗:', error);
      checkoutToast.error(error.message || '付款處理失敗，請稍後再試');
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

  useEffect(() => {
    // 監聽來自付款視窗的訊息
    const handleMessage = (event) => {
      if (event.data === 'LINE_PAY_SUCCESS') {
        // 付款成功，導向訂單頁面
        router.push('/member/purchase-history');
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [router]);

  const handlePayment = async () => {
    try {
      if (formData.paymentMethod === 'line_pay') {
        const response = await fetch('/api/camping/payment/line-pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cartItems,
            amount: calculateTotal(),
            contactInfo: formData
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          // 使用新視窗開啟 LINE Pay
          window.open(result.paymentUrl, 'LINE_PAY_WINDOW', 'width=800,height=800');
        } else {
          throw new Error(result.error || '付款發生錯誤');
        }
      } else {
        // 其他付款方式的處理...
        handleSubmit(e);
      }
    } catch (error) {
      console.error('付款處理失敗:', error);
      alert('付款處理失敗: ' + error.message);
    }
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 信用卡 */}
                    <div 
                      className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300
                        ${formData.paymentMethod === 'credit_card' 
                          ? 'border-[var(--primary-brown)] bg-gradient-to-br from-white to-[var(--lightest-brown)] shadow-md transform scale-[1.02]' 
                          : 'border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:shadow-sm'
                        }`}
                      onClick={() => handleInputChange({ target: { name: 'paymentMethod', value: 'credit_card' } })}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={formData.paymentMethod === 'credit_card'}
                        onChange={handleInputChange}
                        className="absolute opacity-0"
                      />
                      {formData.paymentMethod === 'credit_card' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--primary-brown)] rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={`flex flex-col items-center justify-center gap-2 py-3
                        ${formData.paymentMethod === 'credit_card' ? 'transform scale-105' : ''}`}>
                        <FaCreditCard className={`text-3xl transition-colors duration-300
                          ${formData.paymentMethod === 'credit_card' ? 'text-[var(--primary-brown)]' : 'text-[var(--secondary-brown)]'}`} />
                        <span className={`text-lg font-medium transition-colors duration-300
                          ${formData.paymentMethod === 'credit_card' ? 'text-[var(--primary-brown)]' : 'text-[var(--gray-3)]'}`}>
                          信用卡
                        </span>
                      </div>
                    </div>

                    {/* LINE Pay */}
                    <div 
                      className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300
                        ${formData.paymentMethod === 'line_pay' 
                          ? 'border-[var(--primary-brown)] bg-gradient-to-br from-white to-[var(--lightest-brown)] shadow-md transform scale-[1.02]' 
                          : 'border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:shadow-sm'
                        }`}
                      onClick={() => {
                        handleInputChange({ 
                          target: { 
                            name: 'paymentMethod', 
                            value: 'line_pay' 
                          } 
                        });
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="line_pay"
                        checked={formData.paymentMethod === 'line_pay'}
                        onChange={handleInputChange}
                        className="absolute opacity-0"
                      />
                      {formData.paymentMethod === 'line_pay' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--primary-brown)] rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={`flex flex-col items-center justify-center gap-2 py-3
                        ${formData.paymentMethod === 'line_pay' ? 'transform scale-105' : ''}`}>
                        <FaLine className={`text-3xl transition-colors duration-300
                          ${formData.paymentMethod === 'line_pay' ? 'text-[#06C755]' : 'text-[#06C755] opacity-70'}`} />
                        <span className={`text-lg font-medium transition-colors duration-300
                          ${formData.paymentMethod === 'line_pay' ? 'text-[var(--primary-brown)]' : 'text-[var(--gray-3)]'}`}>
                          LINE Pay
                        </span>
                      </div>
                    </div>

                    {/* 現場付款 */}
                    <div 
                      className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300
                        ${formData.paymentMethod === 'on_site' 
                          ? 'border-[var(--primary-brown)] bg-gradient-to-br from-white to-[var(--lightest-brown)] shadow-md transform scale-[1.02]' 
                          : 'border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:shadow-sm'
                        }`}
                      onClick={() => handleInputChange({ target: { name: 'paymentMethod', value: 'on_site' } })}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="on_site"
                        checked={formData.paymentMethod === 'on_site'}
                        onChange={handleInputChange}
                        className="absolute opacity-0"
                      />
                      {formData.paymentMethod === 'on_site' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--primary-brown)] rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={`flex flex-col items-center justify-center gap-2 py-3
                        ${formData.paymentMethod === 'on_site' ? 'transform scale-105' : ''}`}>
                        <FaMoneyBill className={`text-3xl transition-colors duration-300
                          ${formData.paymentMethod === 'on_site' ? 'text-[var(--primary-brown)]' : 'text-[var(--secondary-brown)]'}`} />
                        <span className={`text-lg font-medium transition-colors duration-300
                          ${formData.paymentMethod === 'on_site' ? 'text-[var(--primary-brown)]' : 'text-[var(--gray-3)]'}`}>
                          現場付款
                        </span>
                      </div>
                    </div>
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
                onClick={() => setPaymentUrls({ web: '', app: '' })}
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