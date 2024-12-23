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
  '01': {
    icon: WiDaySunny,
    animation: 'animate-spin-slow hover:animate-spin',  // 緩慢旋轉
    color: '#FFB800'  // 陽光黃色
  },
  '02': {
    icon: WiDayCloudy,
    animation: 'animate-bounce-slow hover:animate-bounce',  // 緩慢彈跳
    color: '#68A7FF'  // 淺藍色
  },
  '03': {
    icon: WiCloudy,
    animation: 'animate-float hover:animate-bounce',  // 漂浮效果
    color: '#9EB8D9'  // 灰藍色
  },
  '04': {
    icon: WiCloudy,
    animation: 'animate-pulse hover:animate-bounce',  // 脈動效果
    color: '#7393B3'  // 深灰藍
  },
  '05': {
    icon: WiDayRain,
    animation: 'animate-bounce-slow hover:animate-bounce',  // 緩慢彈跳
    color: '#4682B4'  // 雨天藍
  },
  '06': {
    icon: WiRain,
    animation: 'animate-rain hover:animate-bounce',  // 下雨效果
    color: '#4169E1'  // 皇家藍
  },
  '07': {
    icon: WiDayThunderstorm,
    animation: 'animate-flash hover:animate-bounce',  // 閃電效果
    color: '#FFD700'  // 金黃色
  },
  '08': {
    icon: WiThunderstorm,
    animation: 'animate-flash-fast hover:animate-bounce',  // 快速閃電
    color: '#FFA500'  // 橙色
  },
  '09': {
    icon: WiFog,
    animation: 'animate-pulse-slow hover:animate-bounce',  // 緩慢脈動
    color: '#B8B8B8'  // 霧灰色
  },
  '10': {
    icon: WiSnow,
    animation: 'animate-snow hover:animate-bounce',  // 下雪效果
    color: '#E0FFFF'  // 淺藍白
  }
};

export default function WeatherIcon({ code = '01', size = 24, color }) {
  const weatherConfig = weatherIconMap[code] || weatherIconMap['01'];
  const IconComponent = weatherConfig.icon;
  
  return (
    <div className={`inline-flex items-center justify-center ${weatherConfig.animation}`}>
      <IconComponent 
        size={size} 
        color={color || weatherConfig.color}
        className="transition-all duration-300" 
      />
    </div>
  );
} 