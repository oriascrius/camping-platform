import { NextResponse } from 'next/server';

// 天氣現象代碼對照表
const weatherCodeMap = {
  '晴天': '01',
  '晴時多雲': '02',
  '多雲時晴': '02',
  '多雲': '03',
  '陰天': '04',
  '陰時多雲': '04',
  '多雲時陰': '04',
  '陰時有雨': '06',
  '多雲時陣雨': '05',
  '午後短暫雷陣雨': '07',
  '雷陣雨': '07',
  '陣雨': '06',
  '短暫陣雨': '06',
  '下雨': '06',
  '豪雨': '08',
  '大雨': '08',
  '霧': '09',
  '陰有雨': '06',
  '多雲有雨': '06'
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const date = searchParams.get('date');

    if (!location) {
      return NextResponse.json({ error: '需要位置參數' }, { status: 400 });
    }

    // 使用一般天氣預報 API (F-C0032-001)
    const response = await fetch(
      `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${process.env.CWB_API_KEY}&locationName=${encodeURIComponent(location)}`,
      { next: { revalidate: 1800 } }
    );

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('無法獲取天氣資料');
    }

    // 安全地取得位置資料
    const locations = data.records?.location || [];
    if (locations.length === 0) {
      return NextResponse.json({
        location: location,
        weatherData: [],
        message: '找不到該地區的天氣資料'
      });
    }

    const locationData = locations[0];
    const weatherElements = locationData.weatherElement || [];

    // 整理天氣資料
    const weatherData = weatherElements[0]?.time.map(timeData => {
      const wx = weatherElements.find(e => e.elementName === 'Wx')?.time.find(t => t.startTime === timeData.startTime);
      const minT = weatherElements.find(e => e.elementName === 'MinT')?.time.find(t => t.startTime === timeData.startTime);
      const maxT = weatherElements.find(e => e.elementName === 'MaxT')?.time.find(t => t.startTime === timeData.startTime);
      const pop = weatherElements.find(e => e.elementName === 'PoP')?.time.find(t => t.startTime === timeData.startTime);

      const startTime = new Date(timeData.startTime);
      const dateStr = startTime.toISOString().split('T')[0];
      const weatherDesc = wx?.parameter?.parameterName || '晴天';

      return {
        date: dateStr,
        startTime: timeData.startTime,
        endTime: timeData.endTime,
        weather: weatherDesc,
        // 根據天氣描述取得對應代碼
        weatherCode: weatherCodeMap[weatherDesc] || '01',
        temperature: {
          min: minT?.parameter?.parameterName || 'N/A',
          max: maxT?.parameter?.parameterName || 'N/A'
        },
        rainProb: pop?.parameter?.parameterName || '0'
      };
    }) || [];

    // 如果有指定日期，過濾該日期的資料
    const filteredData = date 
      ? weatherData.filter(w => w.date === date)
      : weatherData;

    return NextResponse.json({
      location: locationData.locationName,
      weatherData: filteredData,
      message: filteredData.length === 0 ? '無該日期的天氣資料' : undefined
    });

  } catch (error) {
    console.error('天氣 API 錯誤:', error);
    return NextResponse.json(
      { 
        error: '獲取天氣資訊失敗', 
        message: error.message,
        location: '',
        weatherData: []
      },
      { status: 500 }
    );
  }
} 