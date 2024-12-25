'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { FaUser, FaPhone, FaEnvelope, FaCreditCard, FaMoneyBill, FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
        console.log('購物車資料:', data);
        setCartItems(data.cartItems);
      } catch (error) {
        console.error('獲取購物車資料失敗:', error);
        toast.error('獲取購物車資料失敗');
        router.push('/cart');
      }
    };

    fetchCartData();
  }, []);

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('請檢查並填寫正確的資料');
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
      console.log('結帳回應:', data); // 除錯用

      if (!response.ok) {
        throw new Error(data.error || '預訂失敗');
      }

      // 成功後導向訂單完成頁面
      toast.success('預訂成功！');
      
      // 確保有 bookingId 才導向
      if (data.bookingIds && data.bookingIds.length > 0) {
        router.push(`/camping/checkout/complete?bookingId=${data.bookingIds[0]}`);
      } else if (data.bookingId) {  // 如果是單一 bookingId
        router.push(`/camping/checkout/complete?bookingId=${data.bookingId}`);
      } else {
        throw new Error('未收到預訂編號');
      }

    } catch (error) {
      console.error('結帳錯誤:', error); // 除錯用
      toast.error(error.message);
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：訂單摘要 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">訂單資訊</h2>
            
            {/* 訂單項目列表 */}
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  {/* 可點擊的標題列 */}
                  <div
                    onClick={() => toggleItem(index)}
                    className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{item.activity_name}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(item.start_date), 'yyyy/MM/dd')} ~ 
                        {format(new Date(item.end_date), 'yyyy/MM/dd')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-600 font-medium">
                        NT$ {item.total_price.toLocaleString()}
                      </span>
                      {expandedItems[index] ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </div>

                  {/* 展開的詳細內容 */}
                  {expandedItems[index] && (
                    <div className="p-4 space-y-3 bg-white">
                      <div className="flex justify-between">
                        <span className="text-gray-600">營位名稱</span>
                        <span>{item.spot_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">數量</span>
                        <span>{item.quantity} 個</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">入住日期</span>
                        <span>{format(new Date(item.start_date), 'yyyy/MM/dd')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">退房日期</span>
                        <span>{format(new Date(item.end_date), 'yyyy/MM/dd')}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 總金額 */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between text-xl font-bold">
                <span>總金額</span>
                <span className="text-green-600">
                  NT$ {cartItems.reduce((total, item) => total + item.total_price, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 右側：聯絡資訊表單 */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">聯絡資訊</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                {/* 姓名輸入 */}
                <div className="space-y-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400 text-xl" />
                    </div>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      placeholder="聯絡人姓名"
                      className={`pl-12 w-full rounded-lg border text-lg py-4
                        ${errors.contactName 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                        }`}
                    />
                  </div>
                  {errors.contactName && (
                    <p className="text-red-500 text-sm ml-1">{errors.contactName}</p>
                  )}
                </div>

                {/* 電話輸入 */}
                <div className="space-y-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaPhone className="text-gray-400 text-xl" />
                    </div>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      placeholder="聯絡電話"
                      className={`pl-12 w-full rounded-lg border text-lg py-4
                        ${errors.contactPhone 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                        }`}
                    />
                  </div>
                  {errors.contactPhone && (
                    <p className="text-red-500 text-sm ml-1">{errors.contactPhone}</p>
                  )}
                </div>

                {/* 信箱輸入 */}
                <div className="space-y-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400 text-xl" />
                    </div>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder="電子信箱"
                      className={`pl-12 w-full rounded-lg border text-lg py-4
                        ${errors.contactEmail 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                        }`}
                    />
                  </div>
                  {errors.contactEmail && (
                    <p className="text-red-500 text-sm ml-1">{errors.contactEmail}</p>
                  )}
                </div>

                {/* 付款方式 */}
                <div className="space-y-4">
                  <label className="block text-lg font-medium text-gray-700">付款方式</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex items-center p-5 border rounded-lg cursor-pointer 
                      hover:border-green-500 hover:bg-green-50 transition-colors
                      ${formData.paymentMethod === 'credit_card' ? 'border-green-500 bg-green-50' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={formData.paymentMethod === 'credit_card'}
                        onChange={handleInputChange}
                        className="w-5 h-5 mr-4"
                      />
                      <FaCreditCard className="text-xl mr-3" />
                      <span className="text-lg">信用卡</span>
                    </label>
                    <label className={`flex items-center p-5 border rounded-lg cursor-pointer 
                      hover:border-green-500 hover:bg-green-50 transition-colors
                      ${formData.paymentMethod === 'transfer' ? 'border-green-500 bg-green-50' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={handleInputChange}
                        className="w-5 h-5 mr-4"
                      />
                      <FaMoneyBill className="text-xl mr-3" />
                      <span className="text-lg">行轉帳</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 送出按鈕 */}
              <button
                type="submit"
                disabled={isLoading || Object.values(errors).some(error => error)}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg 
                  hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed 
                  transition duration-200 text-lg font-medium mt-8"
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
    </div>
  );
} 