'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Map({ lat, lng, name }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && lat && lng) {
      if (!mapRef.current) {
        // 初始化地圖
        const map = L.map('map').setView([lat, lng], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        mapRef.current = map;
      } else {
        // 更新地圖視圖
        mapRef.current.setView([lat, lng], 15);
      }

      // 更新或創建標記
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng])
          .addTo(mapRef.current)
          .bindPopup(name)
          .openPopup();
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [lat, lng, name]);

  return <div id="map" className="h-full w-full" />;
} 