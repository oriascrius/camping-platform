"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format, addDays } from "date-fns";
import { zhTW } from "date-fns/locale";
import dynamic from "next/dynamic";
import WeatherIcon from "@/components/camping/WeatherIcon";
import { WiRaindrop, WiDaySunny } from "weather-icons-react";
import DiscussionSection from "@/components/camping/discussions/DiscussionSection";
import { showCartAlert, showLoginAlert } from "@/utils/sweetalert";
import { CampLocationMap } from "@/components/camping/maps/CampLocationMap";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DatePicker, ConfigProvider } from "antd";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;

const Map = dynamic(() => import("@/components/camping/Map"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 animate-pulse" />,
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
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [dayCount, setDayCount] = useState(0);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (activityId) {
      fetchActivityDetails();
    }
  }, [activityId]);

  const formatPrice = (price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return "NT$ 0";

    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(numPrice)
      .replace("TWD", "NT$");
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

  const handleDateChange = (type, date) => {
    try {
      if (!date) {
        if (type === "start") {
          setSelectedStartDate(null);
          setDayCount(0);
        } else {
          setSelectedEndDate(null);
          setDayCount(0);
        }
        setSelectedOption(null);
        setQuantity(1);
        return;
      }

      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      // 驗證日期是否在活動期間內
      const activityStartDate = new Date(activity.start_date);
      const activityEndDate = new Date(activity.end_date);

      if (
        normalizedDate < activityStartDate ||
        normalizedDate > activityEndDate
      ) {
        showCartAlert.error("選擇的日期必須在活動期間內");
        return;
      }

      if (type === "start") {
        setSelectedStartDate(normalizedDate);
        if (selectedEndDate && normalizedDate > selectedEndDate) {
          setSelectedEndDate(null);
          setDayCount(0);
        } else if (selectedEndDate) {
          const diffTime = selectedEndDate - normalizedDate;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          setDayCount(diffDays);
        }
      } else {
        if (selectedStartDate && normalizedDate < selectedStartDate) {
          showCartAlert.error("結束日期不能早於開始日期");
          return;
        }

        setSelectedEndDate(normalizedDate);
        if (selectedStartDate) {
          const diffTime = normalizedDate - selectedStartDate;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          setDayCount(diffDays);
        }
      }

      setSelectedOption(null);
      setQuantity(1);
    } catch (error) {
      console.error("日期處理錯誤:", error);
      showCartAlert.error("日期格式錯誤");
    }
  };

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

      const totalPrice = calculateTotalPrice();

      const cartData = {
        userId: userId,
        activityId: activityId,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        optionId: selectedOption.option_id,
        quantity: quantity,
        totalPrice: totalPrice,
      };

      const formattedStartDate = format(selectedStartDate, "yyyy-MM-dd");
      const formattedEndDate = format(selectedEndDate, "yyyy-MM-dd");

      // 加入購物車
      const response = await fetch("/api/camping/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cartData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "加入購物車失敗");
      }

      showCartAlert.success("成功加入購物車！");

      window.dispatchEvent(
        new CustomEvent("cartUpdate", {
          detail: { type: "add" },
        })
      );
    } catch (error) {
      console.error("加入購物車失敗:", error);
      await showCartAlert.error("加入購物車失敗", "請稍後再試");
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
      const cityMatch = address.match(/^(.{2,3}(縣|市))/);
      const location = cityMatch ? cityMatch[0] : address.substring(0, 3);

      const response = await fetch(
        `/api/camping/weather?location=${encodeURIComponent(location)}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || data.error);
      }

      setWeather(data);
    } catch (error) {
      console.error("獲取天氣資訊失敗:", error);
      setWeather({ location: "", weatherData: [], error: error.message });
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (activity?.camp_address) {
      fetchWeather(activity.camp_address);
    }
  }, [activity?.camp_address]);

  const getWeatherClass = (description = "") => {
    if (!description || typeof description !== "string") {
      return "sunny";
    }

    if (description.includes("雷")) return "thunder";
    if (description.includes("雨")) return "rainy";
    if (description.includes("陰")) return "cloudy";
    if (description.includes("多雲")) return "cloudy";
    if (description.includes("霧")) return "foggy";
    if (description.includes("晴")) return "sunny";

    return "sunny";
  };

  const renderWeatherInfo = () => {
    if (!weather || !weather.weatherData || weather.weatherData.length === 0) {
      return null;
    }

    const groupedWeatherData = weather.weatherData.reduce((acc, data) => {
      const date = format(new Date(data.startTime), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(data);
      return acc;
    }, {});

    if (!selectedWeatherDate) {
      setSelectedWeatherDate(Object.keys(groupedWeatherData)[0]);
    }

    const selectedDayData = groupedWeatherData[selectedWeatherDate] || [];

    return (
      <div className="col-span-full">
        <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-2">
              <WiDaySunny size={24} className="weather-icon sunny" />
              <h3 className="text-base font-medium text-gray-700">
                {weather.location} 天氣預報
              </h3>
            </div>
            <select
              value={selectedWeatherDate || ""}
              onChange={(e) => setSelectedWeatherDate(e.target.value)}
              className="px-3 py-1 text-sm bg-white border border-blue-100 rounded-full 
                       shadow-sm hover:border-blue-300 focus:border-blue-400 
                       focus:ring-1 focus:ring-blue-200 focus:outline-none
                       transition-all duration-300"
            >
              {Object.keys(groupedWeatherData).map((date) => (
                <option key={date} value={date}>
                  {format(new Date(date), "MM/dd (EEEE)", { locale: zhTW })}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {selectedDayData.map((data, index) => (
              <div
                key={`${data.startTime}-${data.endTime}-${index}`}
                className="weather-card bg-white/70 backdrop-blur-sm p-4 rounded-lg
                         hover:bg-white/90"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-800">
                      {format(new Date(data.startTime), "HH:mm")}
                      <span className="text-gray-400 mx-1">-</span>
                      {format(new Date(data.endTime), "HH:mm")}
                    </p>
                  </div>

                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <WeatherIcon
                      weatherCode={data.weather}
                      size={48}
                      className={`weather-icon ${getWeatherClass(
                        data.weather
                      )}`}
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-full">
                      {data.weather || "無天氣資訊"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium">
                      {data.temperature.min}°
                    </span>
                    <span className="text-gray-400">-</span>
                    <span className="text-red-500 font-medium">
                      {data.temperature.max}°
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-blue-50/50 rounded-full px-3 py-1">
                    <WiRaindrop
                      size={18}
                      className="weather-icon rainy text-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      {data.rainProb}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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

  const renderTabContent = () => {
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
                    latitude: activity.latitude || 23.5,
                    longitude: activity.longitude || 121,
                    altitude: activity.altitude || "未提供",
                    drivingTime: activity.driving_time || "依路況而定",
                    nearbyStore: activity.nearby_store || "請洽營地",
                    parking: activity.parking_info || "請洽營地",
                  }}
                />
              )}
            </div>
            {mapPosition && (
              <div className="h-[300px] rounded-lg overflow-hidden shadow-sm">
                <Map
                  lat={mapPosition.lat}
                  lng={mapPosition.lng}
                  name={activity?.campInfo?.name}
                  address={activity?.campInfo?.address}
                />
              </div>
            )}
          </div>
        );

      case "discussions":
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">討論區</h2>
            <DiscussionSection activityId={activityId} />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-600">活動不存在或已下架</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activity?.main_image && (
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image
                src={`/uploads/activities/${activity.main_image}`}
                alt={activity.activity_name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 66vw"
                priority
              />
            </div>
          )}

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { id: "info", name: "營地資訊" },
                { id: "weather", name: "天氣資訊" },
                { id: "location", name: "位置資訊" },
                { id: "discussions", name: "討論區" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6">{renderTabContent()}</div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
            <h1 className="text-2xl font-bold mb-2">{activity?.activity_name}</h1>
            <p className="text-gray-600 mb-4">{activity?.title}</p>
            
            <div className="text-2xl font-bold text-[#5C8D5C] mb-6">
              {activity?.min_price === activity?.max_price
                ? formatPrice(activity?.min_price)
                : `${formatPrice(activity?.min_price)} ~ ${formatPrice(activity?.max_price)}`}
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
                  {format(new Date(activity?.start_date), "yyyy/MM/dd", {
                    locale: zhTW,
                  })}
                  <span className="mx-2">~</span>
                  {format(new Date(activity?.end_date), "yyyy/MM/dd", {
                    locale: zhTW,
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[20px]">選擇日期</h2>
                {!selectedStartDate && (
                  <div className="text-sm text-green-600 animate-pulse flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">1</span>
                    請先選擇日期 ←
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <DatePicker
                    value={selectedStartDate ? dayjs(selectedStartDate) : null}
                    onChange={(date) =>
                      handleDateChange("start", date?.toDate())
                    }
                    format="YYYY/MM/DD"
                    placeholder="開始日期"
                    className="w-full"
                    disabledDate={(current) => {
                      return current && current < dayjs().startOf("day");
                    }}
                  />
                  <DatePicker
                    value={selectedEndDate ? dayjs(selectedEndDate) : null}
                    onChange={(date) => handleDateChange("end", date?.toDate())}
                    format="YYYY/MM/DD"
                    placeholder="結束日期"
                    className="w-full"
                    disabledDate={(current) => {
                      const startDay = selectedStartDate
                        ? dayjs(selectedStartDate)
                        : null;
                      return (
                        (current && current < dayjs().startOf("day")) ||
                        (startDay && current && current < startDay)
                      );
                    }}
                  />
                </ConfigProvider>
              </div>
              {dayCount > 0 && (
                <div className="text-sm text-gray-600 bg-green-50 p-2 rounded-lg border border-green-100">
                  <span className="font-medium">預訂時間：</span>共 {dayCount}{" "}
                  {dayCount > 1 ? "晚" : "晚"}
                </div>
              )}
            </div>

            {selectedStartDate && selectedEndDate && activity?.options && activity.options.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[20px]">選擇營位</h2>
                  {!selectedOption && (
                    <div className="text-sm text-green-600 animate-pulse flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">2</span>
                      請選擇營位 ←
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {activity.options.map((option) => (
                    <div
                      key={option.option_id}
                      onClick={() =>
                        option.max_quantity > 0 && handleOptionSelect(option)
                      }
                      className={`
                      relative p-2 rounded-xl border transition-all duration-300 hover:shadow-lg
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
                        <div className="text-base font-medium text-gray-800">
                          {option.spot_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          剩餘: {option.max_quantity}
                        </div>
                        <div className="text-xl font-semibold text-[#5C8D5C]">
                          NT$ {option.price.toLocaleString()}
                        </div>
                      </div>
                      {selectedOption?.option_id === option.option_id && (
                        <div className="absolute top-3 right-3">
                          <div className="w-2 h-2 rounded-full bg-[#87A193]"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedOption && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[20px]">選擇數量</h2>
                  {quantity === 1 && (
                    <div className="text-sm text-green-600 animate-pulse flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">3</span>
                      請選擇數量 ←
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <span className="text-gray-600 font-medium">數量</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => quantity > 1 && setQuantity(quantity - 1)}
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
                <span className="text-lg font-medium">總金額</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(
                    selectedOption
                      ? selectedOption.price * quantity * dayCount
                      : 0
                  )}
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
  );
}
