'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { FaCheckCircle, FaCreditCard, FaMoneyBill, FaLine, FaFileAlt, FaUser, FaCampground, FaCalendar, FaUsers, FaClock } from 'react-icons/fa';

// ===== 自定義工具引入 =====
import { 
  showSystemAlert,      // 系統錯誤提示
  showCompleteAlert     // 完成頁面專用提示
} from "@/utils/sweetalert";

import {
  checkoutToast,       // 結帳相關提示
  ToastContainerComponent // Toast 容器組件
} from "@/utils/toast";

// 狀態對應的中文和顏色配置
const STATUS_MAP = {
  pending: { text: '待確認', color: 'text-yellow-600' },
  confirmed: { text: '已確認', color: 'text-green-600' },
  cancelled: { text: '已取消', color: 'text-red-600' }
};

const PAYMENT_STATUS_MAP = {
  pending: { text: '待付款', color: 'text-yellow-600' },
  paid: { text: '已付款', color: 'text-green-600' },
  failed: { text: '付款失敗', color: 'text-red-600' },
  refunded: { text: '已退款', color: 'text-gray-600' }
};

// 更新支付方式對應圖示
const PAYMENT_METHOD_MAP = {
  credit_card: { icon: FaCreditCard, text: '信用卡支付', color: 'text-blue-600' },
  transfer: { icon: FaMoneyBill, text: '銀行轉帳', color: 'text-green-600' },
  line_pay: { icon: FaLine, text: 'LINE Pay', color: 'text-[#06C755]' }  // 新增 LINE Pay
};

export default function OrderCompletePage() {
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const bookingId = searchParams.get('bookingId');
        if (!bookingId) {
          // 簡單參數錯誤 -> 使用 Toast（輕量級提示）
          checkoutToast.error('無效的訂單編號');
          return;
        }

        const response = await fetch(`/api/camping/checkout/complete?bookingId=${bookingId}`);
        if (!response.ok) {
          const errorData = await response.json();
          
          // 根據錯誤類型選擇提示方式
          if (errorData.error.includes('找不到訂單')) {
            // 訂單不存在（重要錯誤）-> 使用 SweetAlert
            await showCompleteAlert.criticalError(
              '找不到訂單',
              '無法找到您的訂單資料，請確認訂單編號是否正確'
            );
          } else if (errorData.error.includes('訂單已過期')) {
            // 訂單過期（重要狀態）-> 使用 SweetAlert
            await showCompleteAlert.orderStatus(
              'cancelled',
              '您的訂單已過期，請重新預訂'
            );
          } else if (errorData.error.includes('權限不足')) {
            // 權限錯誤（重要提示）-> 使用 SweetAlert
            await showCompleteAlert.criticalError(
              '權限不足',
              '您沒有權限查看此訂單'
            );
          } else if (errorData.error.includes('付款失敗')) {
            // 付款失敗（重要狀態）-> 使用 SweetAlert
            await showCompleteAlert.orderStatus(
              'failed',
              '訂單付款失敗，請重新嘗試付款'
            );
          } else {
            // 系統錯誤 -> 使用 showSystemAlert
            await showSystemAlert.error('獲取訂單資料失敗');
          }
          return;
        }
        
        const data = await response.json();
        setOrderData(data);

        // 根據訂單狀態顯示對應提示
        switch (data.status) {
          case 'confirmed':
            // 訂單確認（重要狀態）-> 使用 SweetAlert
            await showCompleteAlert.orderStatus('confirmed', '您的訂單已確認成功！');
            break;
          case 'pending':
            // 處理中（一般提示）-> 使用 Toast
            checkoutToast.info('訂單正在處理中，請稍候...');
            break;
          case 'cancelled':
            // 已取消（重要狀態）-> 使用 SweetAlert
            await showCompleteAlert.orderStatus('cancelled', '您的訂單已被取消');
            break;
          case 'refunded':
            // 已退款（重要狀態）-> 使用 SweetAlert
            await showCompleteAlert.orderStatus('refunded', '您的訂單已完成退款');
            break;
          default:
            // 未知狀態（一般提示）-> 使用 Toast
            checkoutToast.info(`訂單狀態：${data.status}`);
        }

        // 根據付款狀態顯示額外提示
        if (data.payment_status === 'pending') {
          // 待付款提醒（重要提示）-> 使用 SweetAlert
          await showCompleteAlert.paymentReminder(
            '請完成付款',
            '您的訂單尚未完成付款，請盡快完成付款程序'
          );
        }

      } catch (error) {
        console.error('獲取訂單資料錯誤:', error);
        // 未預期的錯誤 -> 使用 showSystemAlert
        await showSystemAlert.unexpectedError();
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">找不到訂單資料</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen bg-[var(--lightest-brown)]">
      {/* 訂單成功標題區塊 - 使用動畫效果 */}
      <div className="text-center mb-12 animate-float">
        <div className="relative inline-block">
          <FaCheckCircle className="text-[var(--primary-brown)] text-7xl mx-auto mb-6 
            transition-transform hover:scale-110 duration-300" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-[var(--secondary-brown)] 
            rounded-full animate-pulse-slow"></div>
        </div>
        <h1 className="text-4xl font-bold text-[var(--primary-brown)] mb-3
          font-zh tracking-wide">訂單完成</h1>
        <p className="text-[var(--gray-3)] mt-4 text-lg">
          感謝您的預訂！您的訂單編號：
          <span className="font-medium text-[var(--primary-brown)] ml-2 
            tracking-wider">{orderData.booking_id}</span>
        </p>
      </div>

      {/* 訂單資訊卡片 - 使用陰影和漸變效果 */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden 
        transition-transform hover:scale-[1.01] duration-300
        border border-[var(--tertiary-brown)]">
        
        {/* 訂單基本資訊 */}
        <div className="p-8 border-b border-[var(--tertiary-brown)]
          bg-gradient-to-r from-[var(--lightest-brown)] to-white">
          <h2 className="text-2xl font-bold mb-6 text-[var(--primary-brown)]
            flex items-center gap-2">
            <FaFileAlt className="text-[var(--secondary-brown)]" />
            訂單資訊
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {/* 訂單日期 */}
            <div className="p-4 rounded-lg bg-white shadow-sm
              hover:shadow-md transition-shadow duration-300">
              <p className="text-[var(--gray-3)] mb-2">訂單日期</p>
              <p className="font-medium text-[var(--primary-brown)]">
                {format(new Date(orderData.created_at), 'yyyy/MM/dd HH:mm')}
              </p>
            </div>

            {/* 付款方式 */}
            <div className="p-4 rounded-lg bg-white shadow-sm
              hover:shadow-md transition-shadow duration-300">
              <p className="text-[var(--gray-3)] mb-2">付款方式</p>
              <p className="font-medium flex items-center gap-2">
                {(() => {
                  const PaymentIcon = PAYMENT_METHOD_MAP[orderData.payment_method]?.icon;
                  return (
                    <>
                      {PaymentIcon && <PaymentIcon className={
                        PAYMENT_METHOD_MAP[orderData.payment_method]?.color
                      } />}
                      <span className="text-[var(--primary-brown)]">
                        {PAYMENT_METHOD_MAP[orderData.payment_method]?.text}
                      </span>
                    </>
                  );
                })()}
              </p>
            </div>

            {/* 訂單狀態 */}
            <div className="p-4 rounded-lg bg-white shadow-sm
              hover:shadow-md transition-shadow duration-300">
              <p className="text-[var(--gray-3)] mb-2">訂單狀態</p>
              <p className={`font-medium ${STATUS_MAP[orderData.status]?.color} 
                flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full ${
                  orderData.status === 'confirmed' ? 'bg-green-500 animate-pulse' :
                  orderData.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></span>
                {STATUS_MAP[orderData.status]?.text}
              </p>
            </div>

            {/* 付款狀態 */}
            <div className="p-4 rounded-lg bg-white shadow-sm
              hover:shadow-md transition-shadow duration-300">
              <p className="text-[var(--gray-3)] mb-2">付款狀態</p>
              <p className={`font-medium ${PAYMENT_STATUS_MAP[orderData.payment_status]?.color}
                flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full ${
                  orderData.payment_status === 'paid' ? 'bg-green-500 animate-pulse' :
                  orderData.payment_status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></span>
                {PAYMENT_STATUS_MAP[orderData.payment_status]?.text}
              </p>
            </div>
          </div>
        </div>

        {/* 聯絡人資訊 */}
        <div className="p-8 border-b border-[var(--tertiary-brown)]">
          <h2 className="text-2xl font-bold mb-6 text-[var(--primary-brown)]
            flex items-center gap-2">
            <FaUser className="text-[var(--secondary-brown)]" />
            聯絡人資訊
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-white shadow-sm
              hover:shadow-md transition-shadow duration-300">
              <p className="text-[var(--gray-3)] mb-2">姓名</p>
              <p className="font-medium text-[var(--primary-brown)]">
                {orderData.contact_name}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white shadow-sm
              hover:shadow-md transition-shadow duration-300">
              <p className="text-[var(--gray-3)] mb-2">電話</p>
              <p className="font-medium text-[var(--primary-brown)]">
                {orderData.contact_phone}
              </p>
            </div>
            <div className="col-span-2 p-4 rounded-lg bg-white shadow-sm
              hover:shadow-md transition-shadow duration-300">
              <p className="text-[var(--gray-3)] mb-2">電子信箱</p>
              <p className="font-medium text-[var(--primary-brown)]">
                {orderData.contact_email}
              </p>
            </div>
          </div>
        </div>

        {/* 預訂項目 */}
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-[var(--primary-brown)]
            flex items-center gap-2">
            <FaCampground className="text-[var(--secondary-brown)]" />
            預訂項目
          </h2>
          <div className="space-y-4">
            {orderData.items.map((item, index) => (
              <div key={index} className="border border-[var(--tertiary-brown)] rounded-xl p-6
                hover:shadow-lg transition-all duration-300
                bg-gradient-to-r from-white to-[var(--lightest-brown)]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--primary-brown)] mb-2">
                      {item.activity_name}
                    </h3>
                    <p className="text-[var(--secondary-brown)]">{item.spot_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--primary-brown)]">
                      NT$ {Math.round(item.unit_price).toLocaleString()}
                    </p>
                    <p className="text-[var(--gray-3)]">/ 每晚</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-[var(--gray-3)]">
                    <FaCalendar className="text-[var(--secondary-brown)]" />
                    <span>入住：{format(new Date(item.start_date), 'yyyy/MM/dd')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--gray-3)]">
                    <FaCalendar className="text-[var(--secondary-brown)]" />
                    <span>退房：{format(new Date(item.end_date), 'yyyy/MM/dd')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--gray-3)]">
                    <FaUsers className="text-[var(--secondary-brown)]" />
                    <span>數量：{item.quantity} 個</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--gray-3)]">
                    <FaClock className="text-[var(--secondary-brown)]" />
                    <span>住宿天數：{calculateDays(item.start_date, item.end_date)} 晚</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 總金額 */}
          <div className="mt-8 pt-6 border-t border-[var(--tertiary-brown)]">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-[var(--primary-brown)]">總金額</span>
              <span className="text-3xl font-bold text-[var(--primary-brown)]
                bg-gradient-to-r from-[var(--primary-brown)] to-[var(--secondary-brown)]
                bg-clip-text text-transparent">
                NT$ {Math.round(orderData.total_amount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      <ToastContainerComponent />
    </div>
  );
}
