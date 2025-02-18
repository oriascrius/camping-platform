'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FaMapMarkerAlt, FaMountain, FaParking, FaStore, FaRoute, FaTemperatureHigh } from 'react-icons/fa';
import { WiDaySunny, WiRain, WiCloudy, WiRaindrop } from 'weather-icons-react';

export function CampLocationMap({ campData }) {
  const mapRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState({});
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  // 取得天氣資訊
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherError(null);
        setIsLoading(true);
        
        // 使用營地所在縣市名稱取得天氣資訊
        const response = await fetch(
          `/api/camping/weather?location=${encodeURIComponent(campData.county)}`
        );
        
        const data = await response.json();
        
        // 取得當前時段的天氣資料（API 返回的第一筆資料）
        const currentWeather = data.weatherData[0];
        
        if (currentWeather) {
          setWeather({
            description: currentWeather.weather,
            temperature: {
              min: currentWeather.temperature.min,
              max: currentWeather.temperature.max
            },
            rainProb: currentWeather.rainProb,
            weatherCode: currentWeather.weatherCode
          });
        }

      } catch (error) {
        console.error('Failed to fetch weather:', error);
        setWeatherError('無法取得天氣資訊');
      } finally {
        setIsLoading(false);
      }
    };

    if (campData.county) {
      fetchWeather();
    }
  }, [campData]);

  useEffect(() => {
    if (!mapRef.current) return;

    setIsLoading(true);
    d3.select(mapRef.current).selectAll('*').remove();

    const width = 600;
    const height = 450;

    const svg = d3.select(mapRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // 添加多個漸層定義
    const defs = svg.append('defs');
    
    // 主要地圖漸層
    const mainGradient = defs.append('linearGradient')
      .attr('id', 'main-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');

    mainGradient.append('stop')
      .attr('offset', '0%')
      .attr('style', 'stop-color: #E6E4E3; stop-opacity: 1');

    mainGradient.append('stop')
      .attr('offset', '100%')
      .attr('style', 'stop-color: #D1CCC9; stop-opacity: 1');

    // 活躍縣市漸層
    const activeGradient = defs.append('linearGradient')
      .attr('id', 'active-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');

    activeGradient.append('stop')
      .attr('offset', '0%')
      .attr('style', 'stop-color: #B8B2A7; stop-opacity: 1');

    activeGradient.append('stop')
      .attr('offset', '100%')
      .attr('style', 'stop-color: #A39E93; stop-opacity: 1');

    // 懸停效果漸層
    const hoverGradient = defs.append('linearGradient')
      .attr('id', 'hover-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');

    hoverGradient.append('stop')
      .attr('offset', '0%')
      .attr('style', 'stop-color: #CDC7BE; stop-opacity: 1');

    hoverGradient.append('stop')
      .attr('offset', '100%')
      .attr('style', 'stop-color: #B8B2A7; stop-opacity: 1');

    // 增強陰影效果
    const filter = defs.append('filter')
      .attr('id', 'enhanced-shadow')
      .attr('height', '150%');

    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 4)
      .attr('result', 'blur');

    filter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 3)
      .attr('dy', 3)
      .attr('result', 'offsetBlur');

    filter.append('feComponentTransfer')
      .append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', 0.5);

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'offsetBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // 添加縮放功能
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g');

    const projection = d3.geoMercator()
      .center([campData.longitude, campData.latitude])
      .scale(width * 25)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // 添加地圖載入動畫
    const loadingIndicator = svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-gray-400')
      .text('載入地圖中...');

    fetch('/data/taiwan.json')
      .then(response => response.json())
      .then(data => {
        loadingIndicator.remove();

        // 繪製基本地圖
        g.selectAll('path')
          .data(data.features)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('class', d => `county ${d.properties.COUNTYSN === campData.countySN ? 'active-county' : ''}`)
          .attr('fill', d => d.properties.COUNTYSN === campData.countySN ? 'url(#active-gradient)' : 'url(#main-gradient)')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .attr('filter', 'url(#enhanced-shadow)')
          .style('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('fill', 'url(#hover-gradient)')
              .attr('stroke-width', 1.2)
              .attr('transform', 'scale(1.01)');
            
            const [x, y] = d3.pointer(event, svg.node());
            setShowTooltip(true);
            const isActiveCounty = d.properties.COUNTYSN === campData.countySN;
            setTooltipContent({
              name: d.properties.name,
              isActive: isActiveCounty,
              campName: isActiveCounty ? campData.name : null,
              weather: isActiveCounty ? weather : null
            });
            setTooltipPosition({ x, y });
          })
          .on('mouseout', function(event, d) {
            d3.select(this)
              .transition()
              .duration(300)
              .attr('fill', d.properties.COUNTYSN === campData.countySN ? 'url(#active-gradient)' : 'url(#main-gradient)')
              .attr('stroke-width', 1.5)
              .attr('transform', 'scale(1)');
            
            setShowTooltip(false);
          });

        // 添加營地標記
        const marker = g.append('g')
          .attr('transform', `translate(${projection([campData.longitude, campData.latitude]).join(',')})`)
          .style('cursor', 'pointer')
          .on('click', () => {
            window.open(`https://www.google.com/maps/search/?api=1&query=${campData.latitude},${campData.longitude}`);
          })
          .on('mouseover', function() {
            d3.select(this)
              .transition()
              .duration(300)
              .attr('transform', `translate(${projection([campData.longitude, campData.latitude]).join(',')}) scale(1.2)`);
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(300)
              .attr('transform', `translate(${projection([campData.longitude, campData.latitude]).join(',')}) scale(1)`);
          });

        // 添加多層標記動畫效果
        const pulseCircles = [
          { radius: 8, duration: 1500, delay: 0 },
          { radius: 12, duration: 2000, delay: 500 },
          { radius: 16, duration: 2500, delay: 1000 }
        ];

        pulseCircles.forEach(config => {
          marker.append('circle')
            .attr('r', config.radius)
            .attr('fill', '#ef4444')
            .attr('opacity', 0.3)
            .call(circle => {
              function pulse() {
                circle.transition()
                  .duration(config.duration)
                  .delay(config.delay)
                  .attr('r', config.radius * 2.5)
                  .attr('opacity', 0)
                  .transition()
                  .duration(0)
                  .attr('r', config.radius)
                  .attr('opacity', 0.3)
                  .on('end', pulse);
              }
              pulse();
            });
        });

        // 中心標記
        marker.append('circle')
          .attr('r', 6)
          .attr('fill', '#ef4444')
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);

        // 添加營地名稱標籤
        marker.append('text')
          .attr('x', 12)
          .attr('y', 4)
          .attr('class', 'text-sm font-medium fill-gray-700')
          .text(campData.name)
          .style('filter', 'url(#enhanced-shadow)');

        setIsLoading(false);
      });
  }, [campData]);

  // 取得天氣圖標
  const getWeatherIcon = (weatherCode) => {
    switch (weatherCode) {
      case '01':  // 晴天
        return <WiDaySunny size={24} className="text-yellow-500" />;
      case '02':  // 晴時多雲
      case '03':  // 多雲
        return <WiCloudy size={24} className="text-gray-500" />;
      case '04':  // 陰天
        return <WiCloudy size={24} className="text-gray-600" />;
      case '05':  // 多雲時陣雨
      case '06':  // 陣雨
      case '07':  // 雷陣雨
      case '08':  // 大雨
        return <WiRain size={24} className="text-blue-500" />;
      case '09':  // 霧
        return <WiCloudy size={24} className="text-gray-400" />;
      default:
        return <WiCloudy size={24} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 地圖容器 */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          <div 
            ref={mapRef}
            className="w-full aspect-[4/3] max-w-2xl mx-auto relative"
          >
            {/* 將工具提示移到地圖容器內 */}
            {showTooltip && (
              <div
                className="absolute z-50 p-2 text-xs bg-gray-900 bg-opacity-90 
                           rounded-lg shadow-lg backdrop-blur-sm transition-all 
                           duration-200 pointer-events-none min-w-[120px]"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y - 20}px`,
                }}
              >
                <div className="space-y-1 text-white">
                  <div className="font-medium border-b border-gray-700 pb-1">
                    {tooltipContent.name}
                  </div>
                  {tooltipContent.isActive && (
                    <>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <FaMapMarkerAlt className="w-3 h-3" />
                        <span>目前營地位置</span>
                      </div>
                      <div className="text-gray-300">
                        {tooltipContent.campName}
                      </div>
                      {tooltipContent.weather && (
                        <div className="flex items-center gap-2 pt-1 border-t border-gray-700">
                          <div className="flex items-center gap-1">
                            {getWeatherIcon(tooltipContent.weather.weatherCode)}
                            <span>{tooltipContent.weather.description}</span>
                          </div>
                          <div className="text-blue-300">
                            {tooltipContent.weather.temperature.min}°C ~ {tooltipContent.weather.temperature.max}°C
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 資訊卡片網格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={<FaMountain className="text-green-600" />}
          label="海拔高度"
          value={`${campData.altitude || 'N/A'} 公尺`}
        />
        <InfoCard
          icon={<FaParking className="text-blue-600" />}
          label="停車資訊"
          value={campData.parkingInfo || '提供停車場'}
        />
        <InfoCard
          icon={<FaStore className="text-orange-600" />}
          label="附近設施"
          value={campData.nearbyFacilities?.join(', ') || 'N/A'}
        />
        <InfoCard
          icon={<FaRoute className="text-purple-600" />}
          label="路況資訊"
          value={campData.roadCondition || '一般道路'}
        />
        <InfoCard
          icon={getWeatherIcon(weather?.weatherCode)}
          label="天氣狀況"
          value={weatherError || weather?.description || '載入中...'}
          error={!!weatherError}
        />
        <InfoCard
          icon={<FaTemperatureHigh />}
          label="溫度範圍"
          value={weather ? `${weather.temperature.min}°C ~ ${weather.temperature.max}°C` : '載入中...'}
        />
        <InfoCard
          icon={<WiRaindrop />}
          label="降雨機率"
          value={weather ? `${weather.rainProb}%` : '載入中...'}
        />
      </div>
    </div>
  );
}

// 資訊卡片元件
function InfoCard({ icon, label, value, error }) {
  return (
    <div className={`p-4 bg-white rounded-lg shadow-sm border 
      ${error ? 'border-red-200' : 'border-gray-100'} 
      hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <p className={`font-medium truncate
        ${error ? 'text-red-500' : 'text-gray-800'}`}
      >
        {value}
      </p>
    </div>
  );
} 