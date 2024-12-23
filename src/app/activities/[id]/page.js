'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useParams } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import WeatherIcon from '@/components/WeatherIcon';
import { WiRaindrop } from "react-icons/wi";

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 animate-pulse" />
});

export default function ActivityDetail() {
  const params = useParams();
  const activityId = params?.id;
  
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [weather, setWeather] = useState(null);
  const [selectedWeatherDate, setSelectedWeatherDate] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (activityId) {
      fetchActivityDetails();
    }
  }, [activityId]);

  const formatPrice = (price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return 'NT$ 0';
    
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice).replace('TWD', 'NT$');
  };

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/activities/${activityId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '活動不存在或已下架');
      }
      
      console.log('Activity data:', data);
      console.log('Options:', data.options);
      
      setActivity(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedOption(null);
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    if (!selectedDate || !selectedOption) {
      toast.error('請選擇日期和營位');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          optionId: selectedOption.option_id,
          quantity,
          date: format(selectedDate, 'yyyy-MM-dd'),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '加入購物車失敗');
      }

      toast.success('成功加入購物車！');
    } catch (error) {
      toast.error(error.message);
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
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
    }
  };

  useEffect(() => {
    if (activity?.camp_address) {
      getCoordinates(activity.camp_address).then(position => {
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

  const fetchWeather = async (address, date) => {
    try {
      setWeatherLoading(true);
      const cityMatch = address.match(/^(.{2,3}(縣|市))/);
      const location = cityMatch ? cityMatch[0] : address.substring(0, 3);
      
      console.log('正在獲取天氣資料:', location, date);

      const response = await fetch(
        `/api/weather?location=${encodeURIComponent(location)}${date ? `&date=${date}` : ''}`
      );
      const data = await response.json();
      
      console.log('獲取到的天氣資料:', data);
      
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      
      setWeather(data);
    } catch (error) {
      console.error('獲取天氣資訊失敗:', error);
      setWeather({ location: '', weatherData: [], error: error.message });
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (activity?.campInfo?.address) {
      const date = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
      fetchWeather(activity.campInfo.address, date);
    }
  }, [selectedDate, activity?.campInfo?.address]);

  const renderWeatherInfo = () => {
    if (!weather || !weather.weatherData || weather.weatherData.length === 0) {
      return null;
    }

    return (
      <div className="col-span-full bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-500">
            {weather.location} 天氣預報
          </h3>
          <select
            value={selectedWeatherDate || ''}
            onChange={(e) => {
              setSelectedWeatherDate(e.target.value);
              fetchWeather(activity.campInfo.address, e.target.value);
            }}
            className="text-sm border rounded-md px-2 py-1"
          >
            {weather.weatherData.map((data) => (
              <option 
                key={`${data.date}-${data.startTime}`} 
                value={data.date}
              >
                {format(new Date(data.date), 'MM/dd (EEEE)', { locale: zhTW })}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weather.weatherData.map((data) => (
            <div 
              key={`${data.date}-${data.startTime}`}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <WeatherIcon 
                    code={data.weatherCode} 
                    size={48} 
                    color="#3B82F6"
                  />
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-gray-500">
                    {format(new Date(data.startTime), 'HH:mm')} - 
                    {format(new Date(data.endTime), 'HH:mm')}
                  </p>
                  <p className="font-medium">{data.weather}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-red-500 font-medium">
                      {data.temperature.max}°C
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-blue-500 font-medium">
                      {data.temperature.min}°C
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    <WiRaindrop className="text-blue-400" size={20} />
                    <span className="text-sm text-gray-600 ml-1">
                      {data.rainProb}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
        <div className="text-center text-gray-600">
          活動不存在或已下架
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側：主圖和活動資訊 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 主圖 */}
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

          {/* 活動詳情 */}
          <div className="space-y-8">
            {/* 營地資訊 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">營地資訊</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">營地名稱</h3>
                    <p className="mt-1">{activity?.campInfo?.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">地址</h3>
                    <p className="mt-1">{activity?.campInfo?.address}</p>
                  </div>
                </div>
                {activity?.campInfo?.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">營地介紹</h3>
                    <p className="mt-1 text-gray-600">{activity.campInfo.description}</p>
                  </div>
                )}
                {renderWeatherInfo()}
              </div>
            </div>

            {/* 地圖 */}
            {mapPosition && (
              <div className="h-[300px] rounded-lg overflow-hidden shadow-sm">
                <Map 
                  lat={mapPosition.lat}
                  lng={mapPosition.lng}
                  name={activity?.campInfo?.name}
                />
              </div>
            )}

            {/* 注意事項 */}
            {activity?.campInfo?.notice && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">注意事項</h2>
                <div className="prose max-w-none text-gray-600">
                  {activity.campInfo.notice}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右側：預定資訊 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
            <h1 className="text-2xl font-bold mb-2">{activity?.activity_name}</h1>
            <p className="text-gray-600 mb-4">{activity?.title}</p>
            <div className="text-2xl font-bold text-green-600 mb-6">
              {activity?.min_price === activity?.max_price ? (
                formatPrice(activity?.min_price)
              ) : (
                `${formatPrice(activity?.min_price)} ~ ${formatPrice(activity?.max_price)}`
              )}
            </div>

            {/* 日期選擇 */}
            <div className="space-y-4">
              <h2 className="font-semibold">選擇日期</h2>
              <input
                type="date"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  handleDateChange(date);
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
                max={activity?.end_date}
                className="w-full p-2 border rounded-md"
              />
            </div>

            {/* 營位選擇 */}
            {selectedDate && activity?.options && activity.options.length > 0 && (
              <div className="mt-6 space-y-4">
                <h2 className="font-semibold">選擇營位</h2>
                <div className="space-y-3">
                  {activity.options.map((option) => (
                    <div
                      key={option.option_id}
                      onClick={() => option.max_quantity > 0 && handleOptionSelect(option)}
                      className={`
                        relative p-4 rounded-md border cursor-pointer transition-all
                        ${option.max_quantity <= 0 ? 
                          'opacity-50 cursor-not-allowed bg-gray-50' : 
                          selectedOption?.option_id === option.option_id ?
                            'border-green-500 bg-green-50 shadow-sm' :
                            'border-gray-200 hover:border-green-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{option.spot_name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{option.spot_description}</p>
                          <p className="text-sm text-gray-500">容納人數：{option.capacity} 人</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatPrice(option.price)}</p>
                          <p className="text-sm text-gray-500 mt-1">剩餘 {option.max_quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 數量選擇 */}
            {selectedOption && (
              <div className="mt-6">
                <h2 className="font-semibold mb-3">選擇數量</h2>
                <div className="flex items-center justify-between border rounded-md p-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50"
                  >
                    <span className="text-xl">-</span>
                  </button>
                  <span className="text-xl font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedOption.max_quantity, quantity + 1))}
                    disabled={quantity >= selectedOption.max_quantity}
                    className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50"
                  >
                    <span className="text-xl">+</span>
                  </button>
                </div>
              </div>
            )}

            {/* 總金額和加入購物車 */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium">總金額</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(selectedOption ? selectedOption.price * quantity : 0)}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!selectedDate || !selectedOption || isSubmitting}
                className={`
                  w-full py-3 px-6 rounded-lg text-white transition-colors
                  ${(!selectedDate || !selectedOption || isSubmitting)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'}
                `}
              >
                {isSubmitting ? '處理中...' : '加入購物車'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}