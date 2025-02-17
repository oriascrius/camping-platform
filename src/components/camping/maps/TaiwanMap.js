'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export function TaiwanMap({ onRegionSelect }) {
  const mapRef = useRef(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 清除現有的 SVG
    d3.select(mapRef.current).selectAll('*').remove();

    // 調整地圖尺寸，使其更大
    const width = 1000;
    const height = 800;

    const svg = d3.select(mapRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // 調整投影參數使台灣地圖更大
    const projection = d3.geoMercator()
      .center([121, 23.5])
      .scale(width * 15)  // 增加比例尺
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    fetch('/data/taiwan.json')
      .then(response => response.json())
      .then(data => {
        // 繪製地圖區域
        svg.selectAll('path')
          .data(data.features)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('fill', d => selectedRegion?.id === d.properties.COUNTYSN ? '#93c5fd' : '#e8e8e8')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .attr('class', 'county transition-colors duration-300 hover:fill-blue-200 cursor-pointer')
          .on('click', (event, d) => {
            const region = {
              id: d.properties.COUNTYSN,
              name: d.properties.name
            };
            setSelectedRegion(region);
            onRegionSelect(region);
          });

        // 添加地區名稱標籤
        svg.selectAll('text')
          .data(data.features)
          .enter()
          .append('text')
          .attr('x', d => path.centroid(d)[0])
          .attr('y', d => path.centroid(d)[1])
          .attr('text-anchor', 'middle')
          .attr('class', 'font-medium text-base fill-gray-700')  // 增加文字大小
          .text(d => d.properties.name);

        // 添加地圖標題
        svg.append('text')
          .attr('x', width / 2)
          .attr('y', 50)
          .attr('text-anchor', 'middle')
          .attr('class', 'text-2xl font-bold fill-gray-800')
          .text('選擇露營地區');
      });
  }, [onRegionSelect, selectedRegion]);

  return (
    <div className="w-full">
      <div 
        ref={mapRef} 
        className="w-full aspect-[4/3] max-w-2xl mx-auto"
      />
      
      {/* 選中的地區標籤 */}
      {selectedRegion && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[#E6E0D6] text-[#5C4B37]">
            地區: {selectedRegion.name}
            <button
              onClick={() => {
                setSelectedRegion(null);
                onRegionSelect({ id: 'all', name: '全部地區' });
              }}
              className="ml-2 text-[#5C4B37] hover:text-[#3D3224]"
            >
              ✕
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
