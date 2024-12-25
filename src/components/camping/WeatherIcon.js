'use client';
import {
  WiDaySunny,
  WiDayCloudy,
  WiCloudy,
  WiRain,
  WiDayRain,
  WiThunderstorm,
  WiSnow,
  WiDust,
  WiDayFog,
  WiNightClear,
  WiNightCloudy,
  WiNightRain,
  WiNightFog
} from 'weather-icons-react';

export default function WeatherIcon({ weatherCode = '', size = 24, className = '' }) {
  // 天氣描述對應圖示的映射表
  const weatherMapping = {
    // 晴天
    '晴天': WiDaySunny,
    '晴': WiDaySunny,
    '晴時多雲': WiDayCloudy,
    
    // 多雲
    '多雲': WiCloudy,
    '陰天': WiCloudy,
    '陰': WiCloudy,
    '多雲時晴': WiDayCloudy,
    
    // 雨天
    '雨': WiRain,
    '陣雨': WiDayRain,
    '午後短暫雨': WiDayRain,
    '短暫雨': WiDayRain,
    '多雲時陣雨': WiDayRain,
    '多雲時雨': WiRain,
    '陰時雨': WiRain,
    '陰有雨': WiRain,
    
    // 雷雨
    '雷雨': WiThunderstorm,
    '午後雷陣雨': WiThunderstorm,
    '雷陣雨': WiThunderstorm,
    
    // 特殊天氣
    '霧': WiDayFog,
    '起霧': WiDayFog,
    '有霧': WiDayFog,
    '煙霾': WiDust,
    '灰塵': WiDust,
    '揚塵': WiDust,
    '風沙': WiDust,
    '下雪': WiSnow,
    '雪': WiSnow,
    
    // 夜間天氣
    '晴天晚上': WiNightClear,
    '多雲晚上': WiNightCloudy,
    '陣雨晚上': WiNightRain,
    '霧晚上': WiNightFog
  };

  // 取得對應的圖示組件
  const getWeatherIcon = (description = '') => {
    // 如果沒有描述，返回預設圖示
    if (!description) {
      return WiDaySunny;
    }

    // 先嘗試完全匹配
    let Icon = weatherMapping[description];
    
    // 如果沒有完全匹配，則進行部分匹配
    if (!Icon) {
      // 尋找描述中包含的關鍵字
      if (description.includes('雷')) {
        Icon = WiThunderstorm;
      } else if (description.includes('雨')) {
        Icon = WiRain;
      } else if (description.includes('雲')) {
        Icon = WiCloudy;
      } else if (description.includes('晴')) {
        Icon = WiDaySunny;
      } else if (description.includes('霧')) {
        Icon = WiDayFog;
      } else {
        // 預設使用晴天圖示
        Icon = WiDaySunny;
      }
    }

    return Icon;
  };

  const WeatherComponent = getWeatherIcon(weatherCode);

  // 安全地檢查字串方法
  const getIconColor = (code = '') => {
    if (code.includes('晴')) return '#FBBF24';
    if (code.includes('雨')) return '#60A5FA';
    return '#9CA3AF';
  };

  return (
    <WeatherComponent 
      size={size} 
      className={className}
      color={getIconColor(weatherCode)}
    />
  );
} 