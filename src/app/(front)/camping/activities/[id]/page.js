"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format, addDays } from "date-fns";
import { zhTW } from "date-fns/locale";
import dynamic from "next/dynamic";
import WeatherIcon from "@/components/camping/WeatherIcon";
import DiscussionSection from "@/components/camping/discussions/DiscussionSection";
import { showCartAlert, showLoginAlert } from "@/utils/sweetalert";
import { CampLocationMap } from "@/components/camping/maps/CampLocationMap";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DatePicker, ConfigProvider, Tabs, Tooltip, Button, Modal, App } from "antd";
import dayjs from "dayjs";
import { SwapOutlined, SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import RelatedActivities from "@/components/camping/activity/RelatedActivities";
import ParallaxSection from "@/components/camping/activity/ParallaxSection";
import StatisticsSection from "@/components/camping/activity/StatisticsSection";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Loading from "@/components/Loading";
import CartConflictModal from "@/components/camping/activity/CartConflictModal";
const { RangePicker } = DatePicker;

// const Map = dynamic(() => import("@/components/camping/Map"), {
//   ssr: false,
//   loading: () => <div className="h-[300px] bg-gray-100 animate-pulse" />,
// });


const WeatherCard = ({ day }) => {
  const getWeatherClass = (description = "") => {
    if (!description || typeof description !== "string") {
      return "sunny animate-sun-rotate";
    }

    if (description.includes("雷")) return "thunder animate-thunder-flash";
    if (description.includes("雨")) return "rainy animate-rain-fall";
    if (description.includes("陰")) return "cloudy animate-cloud-float";
    if (description.includes("多雲")) return "cloudy animate-cloud-float";
    if (description.includes("霧")) return "foggy animate-fog-drift";
    if (description.includes("晴")) return "sunny animate-sun-rotate";

    return "sunny animate-sun-rotate";
  };

  const startTime = new Date(day.startTime);
  const endTime = new Date(startTime.getTime() + 6 * 60 * 60 * 1000);

  // 新增天氣提醒函數
  const getWeatherTips = (weather = "", temperature = {}) => {
    const tips = [];

    // 根據天氣狀況給予提醒
    if (weather.includes("雷")) {
      tips.push("⚡ 請避免在開闊地區活動");
      tips.push("⛺ 確保帳篷防水性能");
    }
    if (weather.includes("雨")) {
      tips.push("☔ 請攜帶雨具");
      tips.push("🏕️ 選擇地勢較高的營地");
    }
    if (weather.includes("陰") || weather.includes("多雲")) {
      tips.push("🌥️ 天氣變化較大，請準備防雨裝備");
    }
    if (weather.includes("晴")) {
      tips.push("🌞 請做好防曬措施");
      tips.push("💧 請攜帶足夠飲用水");
    }
    if (weather.includes("霧")) {
      tips.push("🌫️ 請注意視線安全");
      tips.push("🔦 建議攜帶照明設備");
    }

    // 根據溫度給予提醒
    if (temperature.max > 28) {
      tips.push("🌡️ 高溫提醒：請預防中暑");
    }
    if (temperature.min < 15) {
      tips.push("🌡️ 低溫提醒：請攜帶保暖衣物");
    }

    return tips;
  };

  return (
    <Tooltip
      title={
        <div className="weather-detail-tooltip p-3">
          <div className="flex items-center justify-between mb-3 border-b border-gray-600 pb-2">
            <h4 className="text-white text-[16px]">
              {format(startTime, "MM/dd")} {format(startTime, "HH:mm")}-
              {format(endTime, "HH:mm")}
            </h4>
            <span className="text-white text-[14px] ps-2">{day.weather}</span>
          </div>

          <div className="space-y-3">
            {/* 溫度資訊 */}
            <div className="flex justify-between items-center text-white">
              <span>溫度範圍</span>
              <span>
                {day.temperature.min}° - {day.temperature.max}°
              </span>
            </div>

            {/* 降雨機率 */}
            {day.rainProb && (
              <div className="flex justify-between items-center text-white">
                <span>降雨機率</span>
                <span>{day.rainProb}%</span>
              </div>
            )}

            {/* 體感溫度 */}
            {day.description?.comfort && (
              <div className="flex justify-between items-center text-white">
                <span>體感溫度</span>
                <span>{day.description.comfort}</span>
              </div>
            )}

            {/* 風向風速 */}
            {day.description?.wind && (
              <div className="flex justify-between items-center text-white">
                <span>風向風速</span>
                <span>
                  {day.description.wind.direction} {day.description.wind.level}
                  級
                  {day.description.wind.speed &&
                    ` (${day.description.wind.speed})`}
                </span>
              </div>
            )}

            {/* 濕度 */}
            {day.description?.humidity && (
              <div className="flex justify-between items-center text-white">
                <span>相對濕度</span>
                <span>{day.description.humidity}%</span>
              </div>
            )}

            {/* 紫外線 */}
            {day.description?.uv && (
              <div className="flex justify-between items-center text-white">
                <span>紫外線指數</span>
                <span>{day.description.uv}</span>
              </div>
            )}

            {/* 能見度 */}
            {day.description?.visibility && (
              <div className="flex justify-between items-center text-white">
                <span>能見度</span>
                <span>{day.description.visibility}</span>
              </div>
            )}

            {/* 天氣提醒 */}
            {day.description?.warning && (
              <div className="mt-3 pt-2 border-t border-gray-600">
                <div className="text-yellow-300 text-sm">
                  ⚠️ {day.description.warning}
                </div>
              </div>
            )}

            {/* 新增：天氣提醒 */}
            <div className="mt-4 pt-3 border-t border-gray-600">
              <div className="text-yellow-300 text-sm font-medium mb-2">
                📝 戶外活動建議：
              </div>
              <div className="space-y-2">
                {getWeatherTips(day.weather, day.temperature).map(
                  (tip, index) => (
                    <div key={index} className="text-white text-sm">
                      {tip}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      }
      color="#4A5568"
      placement="right"
      classNames={{
        root: "weather-tooltip",
      }}
      styles={{
        root: {
          maxWidth: "320px",
        },
      }}
    >
      <div className="weather-card bg-white rounded-lg p-4 hover:shadow-lg transition-all duration-300">
        {/* 時間和天氣圖示 */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-600">
            <div className="font-medium">
              {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
            </div>
            <div className="text-sm">{format(startTime, "MM/dd")}</div>
          </div>
          <div className={`weather-icon ${getWeatherClass(day.weather)}`}>
            <WeatherIcon weatherCode={day.weather} size={24} />
          </div>
        </div>

        {/* 溫度區塊 - 修改這裡 */}
        <div className="flex justify-center gap-8 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">最低</div>
            <div className="text-2xl font-medium">{day.temperature.min}°</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">最高</div>
            <div className="text-2xl font-medium">{day.temperature.max}°</div>
          </div>
        </div>

        {/* 詳細資訊網格 */}
        <div className="grid grid-cols-2 gap-2">
          {day.rainProb && (
            <div className="flex items-center gap-2 bg-gray-50/80 rounded-md p-2">
              <span className="text-blue-500">💧</span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">降雨機率</span>
                <span className="font-medium">{day.rainProb}%</span>
              </div>
            </div>
          )}
          {day.description?.wind && (
            <div className="flex items-center gap-2 bg-gray-50/80 rounded-md p-2">
              <span className="text-gray-500">💨</span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">風速</span>
                <span className="font-medium">
                  {day.description.wind.level}級
                </span>
              </div>
            </div>
          )}
          {day.description?.humidity && (
            <div className="flex items-center gap-2 bg-gray-50/80 rounded-md p-2">
              <span className="text-blue-300">💦</span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">濕度</span>
                <span className="font-medium">{day.description.humidity}%</span>
              </div>
            </div>
          )}
          {day.description?.comfort && (
            <div className="flex items-center gap-2 bg-gray-50/80 rounded-md p-2">
              <span className="text-yellow-500">🌡️</span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">體感</span>
                <span className="font-medium">{day.description.comfort}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Tooltip>
  );
};

// 動態導入 CartConflictModal 組件
const ConflictModal = dynamic(() => import('@/components/camping/activity/CartConflictModal'), {
  ssr: false
});

export default function ActivityDetail() {
  const params = useParams();
  const activityId = params?.id;
  const router = useRouter();
  const { data: session, status } = useSession();

  const isLoggedIn = status === "authenticated";
  const userId = session?.user?.id;

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [weather, setWeather] = useState(null);
  const [selectedWeatherDate, setSelectedWeatherDate] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [dayCount, setDayCount] = useState(0);
  const [activeTab, setActiveTab] = useState("info");
  const cartIconControls = useAnimation();
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictItem, setConflictItem] = useState(null);
  const [modalResolve, setModalResolve] = useState(null);

  useEffect(() => {
    if (activityId) {
      fetchActivityDetails();
    }
  }, [activityId]);

  useEffect(() => {
    if (weather?.weatherData && weather.weatherData.length > 0) {
      const firstDate = format(new Date(weather.weatherData[0].startTime), "MM/dd", { locale: zhTW });
      setSelectedWeatherDate(firstDate);
    }
  }, [weather?.weatherData]);

  const formatPrice = (price, showCurrency = true) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return "NT$ 0";

    const formattedPrice = new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(numPrice)
      .replace("TWD", "NT$");

    return showCurrency ? formattedPrice : formattedPrice.replace("NT$", "");
  };

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/camping/activities/${activityId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "活動不存在或已下架");
      }

      setActivity(data);
    } catch (error) {
      console.error("Error:", error);
      showCartAlert.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (dates) => {
    if (!dates || dates.length !== 2) {
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setDayCount(0);
      setSelectedOption(null);
      setQuantity(1);
      return;
    }

    try {
      const [start, end] = dates;
      const startDate = start.toDate();
      const endDate = end.toDate();

      // 驗證日期是否在活動期間內
      const activityStartDate = new Date(activity.start_date);
      const activityEndDate = new Date(activity.end_date);

      if (startDate < activityStartDate || endDate > activityEndDate) {
        showCartAlert.error("選擇的日期必須在活動期間內");
        return;
      }

      setSelectedStartDate(startDate);
      setSelectedEndDate(endDate);

      // 計算天數
      const diffTime = endDate - startDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      setDayCount(diffDays);

      setSelectedOption(null);
      setQuantity(1);

      // 自動選擇對應的天氣日期標籤
      const startDateStr = format(startDate, "MM/dd", { locale: zhTW });
      setSelectedWeatherDate(startDateStr);
    } catch (error) {
      console.error("日期處理錯誤:", error);
      showCartAlert.error("日期格式錯誤");
    }
  };

  // 加入購物車動畫效果
  const animateCartIcon = async () => {
    // 先縮小
    await cartIconControls.start({
      scale: 0.8,
      transition: { duration: 0.1 }
    });
    // 放大並彈跳
    await cartIconControls.start({
      scale: 1.2,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    });
    // 恢復原狀
    await cartIconControls.start({
      scale: 1,
      transition: { duration: 0.2 }
    });
  };

  // 檢查購物車中是否已存在相同活動
  const checkExistingCartItem = async () => {
    try {
      const response = await fetch('/api/camping/cart', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('獲取購物車失敗');
      }

      const data = await response.json();
      
      // 檢查購物車中是否有相同活動
      const existingItem = data.cartItems.find(item => 
        item.activity_id === parseInt(activityId)
      );

      return existingItem;

    } catch (error) {
      console.error("檢查購物車失敗:", error);
      return null;
    }
  };

  // 更新購物車項目
  const updateCartItem = async (cartId, newQuantity) => {
    try {
      const response = await fetch(`/api/camping/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId,
          quantity: newQuantity,
        }),
      });

      if (!response.ok) {
        throw new Error('更新購物車失敗');
      }

      return true;
    } catch (error) {
      console.error("更新購物車失敗:", error);
      return false;
    }
  };

  // 處理購物車衝突
  const handleCartConflict = async (existingItem) => {
    return new Promise((resolve) => {
      setConflictItem(existingItem);
      setModalResolve(() => resolve);
      setShowConflictModal(true);
    });
  };

  // 處理模態框確認
  const handleModalConfirm = () => {
    setShowConflictModal(false);
    modalResolve(true);
  };

  // 處理模態框取消
  const handleModalCancel = () => {
    setShowConflictModal(false);
    modalResolve(false);
  };

  // ✅ 加入購物車
  const handleAddToCart = async () => {
    try {
      if (!isLoggedIn) {
        const result = await showLoginAlert.warning();
        if (result.isConfirmed) {
          router.push("/auth/login");
        }
        return;
      }

      setIsSubmitting(true);

      if (!selectedStartDate || !selectedEndDate) {
        showCartAlert.error("請選擇日期");
        return;
      }

      if (!selectedOption) {
        showCartAlert.error("請選擇營位");
        return;
      }

      if (quantity < 1) {
        showCartAlert.error("請選擇正確數量");
        return;
      }

      // 檢查購物車是否已有相同活動
      const existingItem = await checkExistingCartItem();

      if (existingItem) {
        const shouldUpdate = await handleCartConflict(existingItem);
        
        if (shouldUpdate) {
          const updated = await updateCartItem(
            existingItem.id,
            quantity
          );

          if (updated) {
            await animateCartIcon();
            showCartAlert.success("成功更新購物車！", "點擊右上角購物車圖標查看");
            window.dispatchEvent(new CustomEvent("cartUpdate", {
              detail: { type: "update", animation: true }
            }));
          } else {
            showCartAlert.error("更新購物車失敗", "請稍後再試");
          }
          return;
        } else {
          return;
        }
      }

      // 新增到購物車
      const totalPrice = calculateTotalPrice();
      const cartData = {
        activityId,
        quantity,
        totalPrice,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        optionId: selectedOption.option_id,
      };

      const response = await fetch("/api/camping/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cartData),
      });

      if (!response.ok) {
        throw new Error("加入購物車失敗");
      }

      await animateCartIcon();
      showCartAlert.success("成功加入購物車！", "點擊右上角購物車圖標查看");
      window.dispatchEvent(new CustomEvent("cartUpdate", {
        detail: { type: "add", animation: true }
      }));

    } catch (error) {
      console.error("購物車操作失敗:", error);
      showCartAlert.error(error.message || "操作失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCoordinates = async (address) => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=tw`
      );
      const data = await response.json();

      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting coordinates:", error);
      return null;
    }
  };

  useEffect(() => {
    if (activity?.camp_address) {
      getCoordinates(activity.camp_address).then((position) => {
        if (position) {
          setMapPosition(position);
        }
      });
    }
  }, [activity?.camp_address]);

  const handleOptionSelect = (option) => {
    if (selectedOption?.option_id === option.option_id) {
      setSelectedOption(null);
      setQuantity(1);
    } else {
      setSelectedOption(option);
      setQuantity(1);
    }
  };

  const fetchWeather = async (address) => {
    try {
      setWeatherLoading(true);
      // console.log('Fetching weather for address:', address);

      // 確保地址存在
      if (!address) {
        throw new Error("地址不能為空");
      }

      // 提取縣市名稱
      const cityMatch = address.match(/^(.{2,3}(縣|市))/);
      const location = cityMatch ? cityMatch[0] : address.substring(0, 3);
      // console.log('Extracted location:', location);

      // 確保有取得地區名稱
      if (!location) {
        throw new Error("無法從地址中提取縣市名稱");
      }

      const response = await fetch(
        `/api/camping/weather?location=${encodeURIComponent(location)}`
      );

      if (!response.ok) {
        throw new Error("天氣資料獲取失敗");
      }

      const data = await response.json();
      // console.log('Weather data:', data);

      if (!data.success) {
        throw new Error(data.message || "無法獲取天氣資料");
      }

      // 確保有天氣資料
      if (!data.weatherData || data.weatherData.length === 0) {
        throw new Error("無天氣資料");
      }

      setWeather(data);
    } catch (error) {
      console.error("獲取天氣資訊失敗:", error);
      setWeather({
        success: false,
        location: "",
        weatherData: [],
        error: error.message,
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (activity?.camp_address) {
      fetchWeather(activity.camp_address);
    }
  }, [activity?.camp_address]);

  const getWeatherSuggestions = (weatherData) => {
    if (!weatherData) return null;

    // 取得當前時段的天氣數據
    const currentWeather = weatherData[0];

    // 露營適合度建議
    const getCampingSuitability = () => {
      if (currentWeather.description?.comfort === "寒冷") {
        return "天氣較冷，請做好保暖準備";
      } else if (currentWeather.description?.comfort === "舒適") {
        return "天氣舒適，非常適合露營活動";
      } else if (currentWeather.description?.comfort?.includes("悶熱")) {
        return "天氣較熱，建議選擇通風處紮營";
      }
      return "天氣適中，適合露營活動";
    };

    // 降雨建議
    const getRainSuggestion = () => {
      const rainProb = currentWeather.description?.rainfall || 0;
      if (rainProb > 70) {
        return "降雨機率高，建議攜帶雨具及防水用品";
      } else if (rainProb > 30) {
        return "可能有短暫降雨，建議準備雨具";
      }
      return "降雨機率低，不需攜帶雨具";
    };

    // 溫度建議
    const getTemperatureSuggestion = () => {
      const tempMin = currentWeather.description?.minTemp;
      const tempMax = currentWeather.description?.maxTemp;
      const tempDiff = tempMax - tempMin;

      if (tempDiff > 8) {
        return "早晚溫差大，建議多帶一件外套";
      } else if (tempMax > 28) {
        return "氣溫較高，建議攜帶防曬用品";
      } else if (tempMin < 15) {
        return "氣溫偏低，請注意保暖";
      }
      return "溫度適中，請備薄外套";
    };

    return {
      campingSuitability: getCampingSuitability(),
      rainSuggestion: getRainSuggestion(),
      temperatureSuggestion: getTemperatureSuggestion(),
    };
  };

  const renderWeatherInfo = () => {
    if (!weather?.weatherData || weather?.weatherData.length === 0) {
      return <div className="text-gray-500">暫無天氣資訊</div>;
    }

    // 將天氣資料按日期分組
    const groupedWeather = weather.weatherData.reduce((acc, day) => {
      const date = format(new Date(day.startTime), "MM/dd", { locale: zhTW });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(day);
      return acc;
    }, {});

    // 獲取第一個日期
    const firstDate = Object.keys(groupedWeather)[0];

    const items = Object.entries(groupedWeather).map(([date, dayWeathers]) => ({
      key: date,
      label: date,
      children: (
        <div className="weather-container">
          {/* 互動提示 */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-blue-600">
              <SwapOutlined />
              <span className="text-sm text-gray-600">左右滑動切換時段</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-green-600">
              <SearchOutlined />
              <span className="text-sm text-gray-600">點擊查看詳情</span>
            </div>
          </div>

          {/* 天氣卡片滾動容器 */}
          <div className="relative">
            <div className="overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex gap-2 min-w-min">
                {dayWeathers.map((day) => (
                  <div
                    key={day.startTime}
                    className="w-[280px] sm:w-[220px] md:w-[240px] lg:w-[260px] shrink-0"
                  >
                    <WeatherCard day={day} />
                  </div>
                ))}
              </div>
            </div>

            {/* 滾動提示陰影 */}
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          </div>
        </div>
      ),
    }));

    return (
      <Tabs
        items={items}
        type="card"
        animated={true}
        className="weather-tabs"
        activeKey={selectedWeatherDate || firstDate}
        onChange={(key) => setSelectedWeatherDate(key)}
        defaultActiveKey={firstDate}
      />
    );
  };

  const calculateTotalPrice = () => {
    if (!selectedOption || !dayCount || !quantity) {
      return 0;
    }

    const price = Number(selectedOption.price);
    const days = Number(dayCount);
    const qty = Number(quantity);

    if (isNaN(price) || isNaN(days) || isNaN(qty)) {
      console.error("價格計算錯誤:", { price, days, qty });
      return 0;
    }

    const total = price * days * qty;

    return total;
  };

  useEffect(() => {}, [
    selectedStartDate,
    selectedEndDate,
    dayCount,
    selectedOption,
    quantity,
  ]);

  // 優化：更流暢的標籤切換動畫
  const tabContentVariants = {
    enter: {
      opacity: 0,
      x: 100,
      scale: 0.95,
      filter: 'blur(16px)',
      rotateY: 15,
      transformPerspective: 1000,
    },
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      rotateY: 0,
      transition: {
        type: "spring",
        stiffness: 200,   // 增加彈簧強度
        damping: 20,
        mass: 0.4,
        filter: {         
          duration: 0.15,  // 更快的模糊消失
          ease: "easeOut"
        }
      }
    },
    exit: {
      opacity: 0,
      x: -100,
      scale: 0.95,
      filter: 'blur(16px)',
      rotateY: -15,
      transition: {
        duration: 0.2,    // 更快的退場
        ease: "easeIn"
      }
    }
  };

  // 新增：標籤按鈕點擊波紋效果
  const tabButtonVariants = {
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  };

  // 新增：標籤內容動畫效果
  const renderTabContent = () => {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="relative" // 確保 3D 效果正確渲染
        >
          {(() => {
            switch (activeTab) {
              case "info":
                return (
                  <div className="space-y-8">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h2 className="text-xl font-semibold mb-4">營地資訊</h2>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">
                              營地名稱
                            </h3>
                            <p className="mt-1">{activity?.campInfo?.name}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">地址</h3>
                            <p className="mt-1">{activity?.campInfo?.address}</p>
                          </div>
                        </div>
                        {activity?.campInfo?.description && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">
                              營地介紹
                            </h3>
                            <p className="mt-1 text-gray-600">
                              {activity.campInfo.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {activity?.campInfo?.notice && (
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">注意事項</h2>
                        <div className="prose max-w-none text-gray-600">
                          {activity.campInfo.notice}
                        </div>
                      </div>
                    )}
                  </div>
                );
              case "weather":
                return (
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">天氣資訊</h2>
                    {renderWeatherInfo()}
                  </div>
                );
              case "location":
                return (
                  <div className="space-y-8">
                    <div className="mb-8">
                      {activity && (
                        <CampLocationMap
                          campData={{
                            name: activity.camp_name,
                            county:
                              activity.camp_address?.match(/^(.{2,3}(縣|市))/)?.[0] ||
                              "未知",
                            countySN: activity.county_sn || "10000000",
                            address: activity.camp_address,
                            latitude: mapPosition?.lat,
                            longitude: mapPosition?.lng,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              case "discussions":
                return (
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    {/* <h2 className="text-xl font-semibold mb-4">評論區</h2> */}
                    <DiscussionSection activityId={activityId} />
                  </div>
                );
              default:
                return null;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  // 新增：圖片區塊動畫效果
  const imageContainerVariants = {
    initial: { 
      opacity: 0,
      scale: 0.95,
      y: 30
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // 新增：圖片懸浮時的光暈效果
  const imageOverlayVariants = {
    initial: {
      opacity: 0,
      background: "linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)",
      left: "-100%"
    },
    hover: {
      opacity: 1,
      left: "100%",
      transition: {
        duration: 1,
        ease: "easeInOut"
      }
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#8B7355',
          borderRadius: 8,
        },
      }}
    >
      <Loading isLoading={loading} />
      {!loading && (
        <div className="max-w-[1440px] mx-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-8">
                {activity?.main_image && (
                  <motion.div
                    className="relative h-[400px] rounded-lg overflow-hidden"
                    variants={imageContainerVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                  >
                    {/* 主圖片 */}
                    <Image
                      src={`/uploads/activities/${activity.main_image}`}
                      alt={activity.activity_name}
                      fill
                      className="object-cover transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 66vw"
                      priority
                    />
                    {/* 懸浮光暈效果 */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      variants={imageOverlayVariants}
                      initial="initial"
                      whileHover="hover"
                      style={{
                        background: "linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)",
                        width: "100%",
                        height: "100%"
                      }}
                    />
                    {/* 圖片陰影效果 */}
                    <div className="absolute inset-0 shadow-inner pointer-events-none" />
                  </motion.div>
                )}

                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8" aria-label="Tabs">
                    {[
                      { id: "info", name: "營地資訊" },
                      { id: "weather", name: "天氣資訊" },
                      { id: "location", name: "位置資訊" },
                      { id: "discussions", name: "評論區" },
                    ].map((tab) => (
                      <motion.button
                        key={tab.id}
                        whileTap="tap"
                        variants={tabButtonVariants}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          relative py-3 px-1 border-b-2 font-medium text-sm
                          ${
                            activeTab === tab.id
                              ? "border-green-500 text-green-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }
                        `}
                      >
                        {tab.name}
                      </motion.button>
                    ))}
                  </nav>
                </div>

                <div className="mt-6">{renderTabContent()}</div>
              </div>

              <div className="lg:col-span-4">
                <div className="sticky top-4">
                  <div className="w-full min-w-[375px] mx-auto lg:w-auto lg:max-w-none bg-white rounded-xl shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-[#4A3C31] mb-2">
                      {activity?.activity_name}
                    </h1>
                    <p className="text-gray-600 mb-4">{activity?.title}</p>

                    <div className="text-xl font-bold text-[#2B5F3A] mb-6 flex items-baseline gap-1">
                      <span className="text-lg font-medium">NT$</span>
                      {activity?.min_price === activity?.max_price ? (
                        formatPrice(activity?.min_price, false)
                      ) : (
                        <>
                          {formatPrice(activity?.min_price, false)}
                          <span className="text-lg mx-2">~</span>
                          {formatPrice(activity?.max_price, false)}
                        </>
                      )}
                    </div>

                    <div className="mb-6">
                      <div className="p-4 bg-[#FDF6E3] rounded-lg border border-[#EAE0C9] hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 text-[#8B7355] mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="font-medium">活動期間</span>
                        </div>
                        <div className="text-[#A3907B] pl-7">
                          {format(new Date(activity?.start_date), "yyyy/MM/dd")} ~{" "}
                          {format(new Date(activity?.end_date), "yyyy/MM/dd")}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-[20px]">選擇日期</h2>
                        {!selectedStartDate && (
                          <div className="text-sm text-[var(--status-error)] animate-pulse flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full text-[green-600] flex items-center justify-center font-medium">
                              1.{" "}
                            </span>
                            請先選擇日期 ←
                          </div>
                        )}
                      </div>

                      <ConfigProvider
                        theme={{
                          token: {
                            colorPrimary: "#8B4513",
                            borderRadius: 8,
                            controlHeight: 40,
                            fontSize: 14,
                          },
                        }}
                        locale={zhTW}
                      >
                        <RangePicker
                          value={[
                            selectedStartDate ? dayjs(selectedStartDate) : null,
                            selectedEndDate ? dayjs(selectedEndDate) : null,
                          ]}
                          onChange={handleRangeChange}
                          format="YYYY/MM/DD"
                          placeholder={["開始日期", "結束日期"]}
                          className="w-full"
                          disabledDate={(current) => {
                            return (
                              current &&
                              (current < dayjs().startOf("day") ||
                                current < dayjs(activity.start_date) ||
                                current > dayjs(activity.end_date))
                            );
                          }}
                        />
                      </ConfigProvider>

                      {dayCount > 0 && (
                        <div className="text-sm text-gray-600 bg-green-50 p-2 rounded-lg border border-green-100">
                          <span className="font-medium">預訂時間：</span>共{" "}
                          {dayCount} {dayCount > 1 ? "晚" : "晚"}
                        </div>
                      )}
                    </div>

                    {selectedStartDate &&
                      selectedEndDate &&
                      activity?.options &&
                      activity.options.length > 0 && (
                        <div className="mt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-[20px] text-[#4A3C31]">
                              選擇營位
                            </h2>
                            {!selectedOption && (
                              <div className="text-sm text-[var(--status-error)] animate-pulse flex items-center gap-1">
                                <span className="w-5 h-5 rounded-full text-[var(--status-error)] flex items-center justify-center font-medium">
                                  2.{" "}
                                </span>
                                請選擇營位 ←
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {activity.options.map((option) => (
                              <div
                                key={option.option_id}
                                onClick={() =>
                                  option.max_quantity > 0 &&
                                  handleOptionSelect(option)
                                }
                                className={`relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg
                                ${
                                  option.max_quantity <= 0
                                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                                    : selectedOption?.option_id === option.option_id
                                    ? "border-[#87A193] bg-[#F7F9F8] shadow-md transform scale-[1.02] cursor-pointer"
                                    : "border-gray-100 hover:border-[#87A193]/50 bg-white hover:bg-[#FAFBFA] cursor-pointer"
                                }
                              `}
                              >
                                <div className="flex flex-col space-y-3">
                                  <div className="text-base font-medium text-[#4A3C31]">
                                    {option.spot_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    剩餘: {option.max_quantity}
                                  </div>
                                  <div className="text-xl font-semibold text-[#2B5F3A]">
                                    <span className="text-base font-medium">
                                      NT
                                    </span>{" "}
                                    {formatPrice(option.price, false)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedOption && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between">
                          <h2 className="font-semibold text-[20px] mb-4">
                            選擇數量
                          </h2>
                          {quantity === 1 && (
                            <div className="text-sm text-[var(--status-error)] animate-pulse flex items-center gap-1">
                              <span className="w-5 h-5 rounded-full text-[var(--status-error)] flex items-center justify-center font-medium">
                                3.{" "}
                              </span>
                              請選擇數量 ←
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                          <span className="text-gray-600 font-medium">數量</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                quantity > 1 && setQuantity(quantity - 1)
                              }
                              className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200
                              ${
                                quantity > 1
                                  ? "border-[#5C8D5C] text-[#5C8D5C] hover:bg-[#5C8D5C] hover:text-white active:bg-[#4F7B4F]"
                                  : "border-gray-200 text-gray-300 cursor-not-allowed"
                              }`}
                            >
                              -
                            </button>
                            <span className="w-12 text-center text-lg font-medium">
                              {quantity}
                            </span>
                            <button
                              onClick={() =>
                                quantity < selectedOption.max_quantity &&
                                setQuantity(quantity + 1)
                              }
                              className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200
                              ${
                                quantity < selectedOption.max_quantity
                                  ? "border-[#5C8D5C] text-[#5C8D5C] hover:bg-[#5C8D5C] hover:text-white active:bg-[#4F7B4F]"
                                  : "border-gray-200 text-gray-300 cursor-not-allowed"
                              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-medium text-[#4A3C31]">
                          總金額
                        </span>
                        <span className="text-2xl font-bold text-[#2B5F3A]">
                          <span className="text-xl font-medium">NT</span>{" "}
                          {formatPrice(calculateTotalPrice(), false)}
                        </span>
                      </div>

                      <button
                        onClick={handleAddToCart}
                        disabled={
                          !selectedStartDate ||
                          !selectedEndDate ||
                          !selectedOption ||
                          isSubmitting
                        }
                        className={`
                          w-full py-3 px-6 rounded-lg text-white transition-all duration-300
                          ${
                            !selectedStartDate ||
                            !selectedEndDate ||
                            !selectedOption ||
                            isSubmitting
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-[#5C8D5C] hover:bg-[#4F7B4F] shadow-md hover:shadow-lg"
                          }
                        `}
                      >
                        {isSubmitting ? "處理中..." : "加入購物車"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 視差滾動區塊 */}
          <ParallaxSection />

          {/* 精選活動區塊 */}
          <div className="relative bg-gray-50 py-12">
            <div className="relative">
              <RelatedActivities currentActivityId={activityId} />
            </div>
          </div>

          {/* 統計數據區塊 */}
          <StatisticsSection />
        </div>
      )}

      {/* 購物車衝突模態框 */}
      <ConflictModal
        open={showConflictModal}
        existingItem={conflictItem}
        newOption={selectedOption}
        newQuantity={quantity}
        newStartDate={selectedStartDate}
        newEndDate={selectedEndDate}
        calculateTotalPrice={calculateTotalPrice}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </ConfigProvider>
  );
}
