'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export function CampLocationMap({ campData }) {
  const mapRef = useRef(null);
  
  useEffect(() => {
    if (!mapRef.current) return;

    // 清除現有的 SVG
    d3.select(mapRef.current).selectAll('*').remove();

    // 調整為更適中的尺寸
    const width = 600;  // 改小一點
    const height = 450; // 保持黃金比例

    const svg = d3.select(mapRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // 調整投影比例，使地圖更聚焦
    const projection = d3.geoMercator()
      .center([121, 23.5])
      .scale(width * 13)  // 略微增加比例使地圖更清晰
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    fetch('/data/taiwan.json')
      .then(response => response.json())
      .then(data => {
        // 繪製基本地圖
        svg.selectAll('path')
          .data(data.features)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('class', d => `county ${d.properties.COUNTYSN === campData.countySN ? 'active-county' : ''}`)
          .attr('fill', d => d.properties.COUNTYSN === campData.countySN ? '#93c5fd' : '#f3f4f6')  // 調整顏色對比
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('transition', 'all 0.2s ease')  // 加快過渡動畫
          // 懸停效果
          .on('mouseover', function(event, d) {
            if (d.properties.COUNTYSN === campData.countySN) {
              d3.select(this)
                .attr('fill', '#60a5fa')
                .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))');
            }
          })
          .on('mouseout', function(event, d) {
            if (d.properties.COUNTYSN === campData.countySN) {
              d3.select(this)
                .attr('fill', '#93c5fd')
                .style('filter', 'none');
            }
          });

        // 添加營地標記
        svg.append('circle')
          .attr('cx', projection([campData.longitude, campData.latitude])[0])
          .attr('cy', projection([campData.longitude, campData.latitude])[1])
          .attr('r', 6)  // 調整標記大小
          .attr('fill', '#ef4444')
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .attr('class', 'animate-pulse');

        // 添加營地名稱標籤
        svg.append('text')
          .attr('x', projection([campData.longitude, campData.latitude])[0])
          .attr('y', projection([campData.longitude, campData.latitude])[1] - 15)
          .attr('text-anchor', 'middle')
          .attr('class', 'font-medium text-sm fill-gray-800')
          .text(campData.name);
      });
  }, [campData]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4">  {/* 減少內邊距 */}
        <div 
          ref={mapRef}
          className="w-full aspect-[4/3] max-w-2xl mx-auto"
        />
      </div>
    </div>
  );
}

// 資訊卡片元件
function InfoCard({ icon, label, value }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
} 