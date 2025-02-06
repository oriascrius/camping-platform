"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";
import {
  CalendarIcon,
  HomeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Link from "next/link";
import { showCartAlert } from "@/utils/sweetalert";
import { motion, AnimatePresence } from "framer-motion";
import { CSSTransition, TransitionGroup } from "react-transition-group";

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState(null);
  const [animatedTotal, setAnimatedTotal] = useState(0);

  // === 計算函數 ===
  const calculateTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      if (canCalculatePrice(item)) {
        return total + item.total_price;
      }
      return total;
    }, 0);
  }, [cartItems]);

  // === 輔助函數 ===
  const canCalculatePrice = (item) => {
    return item.start_date && item.end_date && item.spot_name;
  };

  const canUpdateQuantity = (item) => {
    return item.start_date && item.end_date && item.spot_name;
  };

  const calculateSubtotal = (item) => {
    if (!canCalculatePrice(item)) return 0;
    return (item.total_price || 0) * (item.quantity || 1);
  };

  // === API 操作函數 ===
  const handleUpdateQuantity = async (cartId, newQuantity) => {
    if (!cartId || newQuantity < 1) {
      showCartAlert.error("無效的操作");
      return;
    }

    try {
      const response = await fetch(`/api/camping/cart/${cartId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "更新數量失敗");
      }

      const data = await response.json();
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === cartId
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: data.total_price * newQuantity,
              }
            : item
        )
      );

      showCartAlert.success("已更新數量");
    } catch (error) {
      console.error("更新數量失敗:", error);
      showCartAlert.error(error.message || "更新失敗，請稍後再試");
    }
  };

  const handleRemoveItem = async (cartId) => {
    try {
      // 先詢問用戶是否確定要刪除
      const result = await showCartAlert.confirm(
        "確定要移除此商品？",
        "移除後將無法復原"
      );

      if (!result.isConfirmed) return;

      const response = await fetch(`/api/camping/cart/${cartId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "移除商品失敗");
      }

      // 從購物車列表中移除該商品
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id !== cartId)
      );

      // 顯示成功訊息
      showCartAlert.success("商品已從購物車中移除");

      // 重新計算總金額
      const newTotal = calculateTotal();
      setAnimatedTotal(newTotal);
    } catch (error) {
      console.error("移除商品失敗:", error);
      showCartAlert.error(error.message || "移除失敗，請稍後再試");
    }
  };

  // === 事件處理函數 ===
  const handleQuantityChange = useCallback(
    async (itemId, newQuantity) => {
      setHighlightedItem(itemId);
      await handleUpdateQuantity(itemId, newQuantity);
      setTimeout(() => setHighlightedItem(null), 1000);
    },
    [handleUpdateQuantity]
  );

  // === 效果處理 ===
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // === 優化效能 ===
  const memoizedTotal = useMemo(() => calculateTotal(), [calculateTotal]);

  // === 資料載入 ===
  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await fetch("/api/camping/cart");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "獲取購物車失敗");
      }
      const data = await response.json();
      setCartItems(data.cartItems || []);
    } catch (error) {
      console.error("獲取購物車失敗:", error);
      showCartAlert.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 計算有效的總金額（只計算已完善資訊的項目）
  const calculateValidTotal = () => {
    return cartItems.reduce((total, item) => {
      if (canCalculatePrice(item)) {
        return total + (item.total_price || 0);
      }
      return total;
    }, 0);
  };

  // 檢查是否有未完善的項目
  const hasIncompleteItems = () => {
    return cartItems.some((item) => !canCalculatePrice(item));
  };

  // 簡化天數計算函數
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 直接計算結束日期減去開始日期
    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 直接返回相差天數
    return diffDays;
  };

  // 前往結帳時的檢查
  const handleCheckout = () => {
    if (hasIncompleteItems()) {
      showCartAlert.warning("請先完善所有商品的預訂資訊");
      return;
    }
    router.push("/camping/checkout");
  };

  // 處理價格動畫
  useEffect(() => {
    const targetTotal = calculateTotal();
    const steps = 20; // 動畫步驟數
    const stepDuration = 50; // 每步時間（毫秒）
    const increment = (targetTotal - animatedTotal) / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep < steps) {
        setAnimatedTotal((prev) => prev + increment);
        currentStep++;
      } else {
        setAnimatedTotal(targetTotal); // 確保最終值精確
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [calculateTotal]);

  if (loading) {
    return <div className="container mx-auto p-4">載入中...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      {/* 進度條 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center">
            <div className="w-7 h-7 rounded-full bg-[var(--primary-brown)] text-white text-sm flex items-center justify-center font-medium">
              1
            </div>
            <span className="ml-2 text-[var(--primary-brown)] font-medium">
              購物車
            </span>
          </div>
          <div className="w-12 h-[1px] bg-[var(--gray-6)]"></div>
          <div className="flex items-center opacity-60">
            <div className="w-7 h-7 rounded-full bg-[var(--gray-5)] text-white text-sm flex items-center justify-center">
              2
            </div>
            <span className="ml-2 text-[var(--gray-4)]">填寫資料</span>
          </div>
          <div className="w-12 h-[1px] bg-[var(--gray-6)]"></div>
          <div className="flex items-center opacity-60">
            <div className="w-7 h-7 rounded-full bg-[var(--gray-5)] text-white text-sm flex items-center justify-center">
              3
            </div>
            <span className="ml-2 text-[var(--gray-4)]">訂單確認</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-white rounded-lg shadow-sm border border-[var(--gray-6)]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {cartItems.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="mb-6 text-[var(--primary-brown)] flex flex-col items-center gap-3"
            >
              <motion.div
                className="text-3xl font-bold tracking-wider"
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  y: [-2, 2, -2]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                CAMPING
              </motion.div>
              <motion.div 
                className="text-sm text-[var(--gray-4)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                探索你的露營旅程
              </motion.div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/camping/activities"
                className="inline-flex justify-center gap-2 px-8 py-3 bg-[var(--primary-brown)] text-white rounded-lg hover:bg-[var(--secondary-brown)] transition-all 
                no-underline hover:no-underline"
              >
                <motion.span
                  animate={{ x: [-5, 0, -5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex items-center mb-1"
                >
                  →
                </motion.span>
                <span className="flex items-center">開始探索露營活動</span>
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <TransitionGroup className="divide-y divide-[var(--gray-6)]">
            {cartItems.map((item) => (
              <CSSTransition key={item.id} timeout={500} classNames="item">
                <motion.div
                  className={`p-6 ${
                    highlightedItem === item.id ? "bg-[var(--gray-7)]" : ""
                  }`}
                  whileHover={{ backgroundColor: "var(--gray-7)" }}
                  animate={{
                    scale: highlightedItem === item.id ? 1.02 : 1,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="grid grid-cols-12 gap-4 items-center relative">
                    {/* 刪除按鈕 */}
                    <motion.button
                      whileHover={{ scale: 1.1, color: "var(--status-error)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-2 right-2 text-gray-400 transition-colors"
                    >
                      <FaTrash className="w-3 h-3" />
                    </motion.button>

                    {/* 商品資訊 */}
                    <motion.div className="col-span-6" whileHover={{ x: 5 }}>
                      <div
                        className="flex gap-4"
                        onClick={() =>
                          router.push(`/camping/activities/${item.activity_id}`)
                        }
                      >
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-[var(--gray-7)] border border-[var(--gray-6)] hover:border-[var(--primary-brown)] transition-colors cursor-pointer">
                          <Image
                            src={
                              item.main_image
                                ? `/uploads/activities/${item.main_image}`
                                : "/images/default-activity.jpg"
                            }
                            alt={item.title}
                            fill
                            sizes="(max-width: 768px) 96px, 96px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h3 className="text-[20px] font-medium text-[var(--gray-1)] hover:text-[var(--primary-brown)] transition-colors cursor-pointer">
                            {item.activity_name}
                          </h3>
                          <div className="mt-2 space-y-1">
                            {item.spot_name ? (
                              <div className="flex items-center gap-2 text-sm text-[var(--gray-3)]">
                                <HomeIcon className="h-4 w-4" />
                                <span>{item.spot_name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-sm text-[var(--status-warning)]">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                <span>請選擇營位</span>
                              </div>
                            )}
                            {item.start_date && item.end_date ? (
                              <div className="flex items-center gap-2 text-sm text-[var(--gray-3)]">
                                <CalendarIcon className="h-4 w-4" />
                                <span>
                                  {format(
                                    new Date(item.start_date),
                                    "yyyy/MM/dd"
                                  )}{" "}
                                  -
                                  {format(
                                    new Date(item.end_date),
                                    "yyyy/MM/dd"
                                  )}
                                  <span className="ml-2 text-[var(--primary-brown)]">
                                    {calculateDays(
                                      item.start_date,
                                      item.end_date
                                    )}{" "}
                                    晚
                                  </span>
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-sm text-[var(--status-warning)]">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                <span>請選擇日期</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* 數量控制 */}
                    <div className="col-span-2">
                      <motion.div
                        className="flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="flex items-center border border-[var(--gray-6)] rounded-lg">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            disabled={
                              !canUpdateQuantity(item) || item.quantity <= 1
                            }
                            className="px-3 py-1.5 text-[var(--gray-4)] hover:bg-[var(--gray-7)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <FaMinus className="w-3 h-3" />
                          </button>
                          <span className="w-12 text-center py-1.5 text-[var(--gray-2)]">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            disabled={!canUpdateQuantity(item)}
                            className="px-3 py-1.5 text-[var(--gray-4)] hover:bg-[var(--gray-7)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <FaPlus className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    </div>

                    {/* 價格顯示 */}
                    <div className="col-span-2 text-right">
                      {canCalculatePrice(item) ? (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-medium text-[var(--primary-brown)]"
                        >
                          NT$ {item.total_price.toLocaleString()}
                        </motion.span>
                      ) : (
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-sm text-[var(--status-warning)]"
                        >
                          請完善資訊
                        </motion.span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </CSSTransition>
            ))}
          </TransitionGroup>
        )}

        {/* 總計區域 */}
        <motion.div
          className="p-6 bg-[var(--gray-7)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
            <span className="text-[var(--gray-2)]">總計金額</span>
            <motion.span
              className="text-2xl font-bold text-[var(--primary-brown)]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              NT$ {Math.round(animatedTotal).toLocaleString()}
            </motion.span>
          </div>

          {/* 操作按鈕 */}
          <motion.div
            className="flex justify-between items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div whileHover={{ x: -5 }}>
              <Link
                href="/camping/activities"
                className="flex items-center gap-2 px-6 py-2.5 text-[var(--primary-brown)] no-underline hover:no-underline"
              >
                <span className="flex items-center mb-1">←</span>
                <span>繼續購物</span>
              </Link>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckout}
              disabled={hasIncompleteItems()}
              className={`px-8 py-2.5 rounded-lg ${
                hasIncompleteItems()
                  ? "bg-[var(--gray-5)] cursor-not-allowed"
                  : "bg-[var(--primary-brown)] hover:bg-[var(--secondary-brown)]"
              } text-white`}
            >
              {hasIncompleteItems() ? "請先完善預訂資訊" : "前往結帳"}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
