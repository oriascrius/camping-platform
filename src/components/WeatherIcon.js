'use client';
import { 
  WiDaySunny, 
  WiDayCloudy, 
  WiCloudy, 
  WiRain,
  WiThunderstorm,
  WiSnow,
  WiFog,
  WiDayRain,
  WiNightClear,
  WiNightCloudy,
  WiNightRain,
  WiNightThunderstorm,
  WiDayThunderstorm,
  WiRainMix
} from "react-icons/wi";

const weatherIconMap = {
  '01': WiDaySunny,      // 晴天
  '02': WiDayCloudy,     // 晴時多雲
  '03': WiCloudy,        // 多雲時晴
  '04': WiCloudy,        // 陰天
  '05': WiDayRain,       // 多雲時陣雨
  '06': WiRain,          // 雨天
  '07': WiDayThunderstorm, // 雷雨
  '08': WiThunderstorm,  // 豪雨
  '09': WiFog,           // 霧
  '10': WiSnow,          // 雪
};

export default function WeatherIcon({ code = '01', size = 24, color = "#4B5563" }) {
  console.log('Weather code:', code); // 除錯用
  const IconComponent = weatherIconMap[code] || WiDaySunny;
  
  return (
    <div className="inline-flex items-center justify-center">
      <IconComponent size={size} color={color} />
    </div>
  );
} 