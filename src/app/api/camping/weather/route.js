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

    // 並行請求兩個 API
    const [weatherResponse, uviResponse] = await Promise.all([
      // 天氣預報 API
      fetch(
        `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${process.env.CWB_API_KEY}&locationName=${encodeURIComponent(location)}`,
        { next: { revalidate: 1800 } }
      ),
      // 紫外線預報 API - 修改為正確的 API 端點
      fetch(
        `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0005-001?Authorization=${process.env.CWB_API_KEY}&locationName=${encodeURIComponent(location)}`,
        { next: { revalidate: 1800 } }
      )
    ]);

    const [weatherData, uviData] = await Promise.all([
      weatherResponse.json(),
      uviResponse.json()
    ]);

    if (!weatherData.success) {
      throw new Error('無法獲取天氣資料');
    }

    // 安全地取得位置資料
    const locations = weatherData.records?.location || [];
    if (locations.length === 0) {
      return NextResponse.json({
        location: location,
        weatherData: [],
        message: '找不到該地區的天氣資料'
      });
    }

    const locationData = locations[0];
    const weatherElements = locationData.weatherElement || [];

    // 先印出原始 API 回應
    console.log('原始 UVI API 回應:', JSON.stringify(uviData, null, 2));

    // 檢查資料結構
    console.log('API 回應結構:', {
      success: uviData.success,
      result: uviData.result,
      records: typeof uviData.records,
      location: Array.isArray(uviData.records?.location),
      完整資料: uviData
    });

    // 更新 UVI 資料解析邏輯
    const uviLocation = uviData.records?.location?.find(loc => {
      // 檢查每個地點的參數列表
      const countyParam = loc.parameter?.find(param => 
        param.parameterName === "CountyName"
      );
      
      // 添加除錯日誌
      console.log('比對地區:', {
        API地區: countyParam?.parameterValue,
        請求地區: location,
        完整地點資料: loc
      });
      
      // 比對縣市名稱
      return countyParam?.parameterValue?.includes(location) || 
             location.includes(countyParam?.parameterValue);
    });

    // 取得 UVI 值
    const uviElement = uviLocation?.weatherElement?.find(elem => 
      elem.elementName === "UVI"
    );

    const currentUvi = uviElement?.elementValue 
      ? parseFloat(uviElement.elementValue) 
      : null;

    // 添加詳細的除錯日誌
    console.log('UVI 資料解析:', {
      請求地區: location,
      找到的地區: uviLocation?.locationName,
      地區參數: uviLocation?.parameter,
      UV元素: uviElement,
      UV值: currentUvi,
      原始資料: {
        地區列表: uviData.records?.location?.map(loc => ({
          地點名稱: loc.locationName,
          縣市名稱: loc.parameter?.find(p => p.parameterName === "CountyName")?.parameterValue
        })),
        API回應: uviData
      }
    });

    // 整理天氣資料
    const processedWeatherData = weatherElements[0]?.time.map(timeData => {
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
        weatherCode: weatherCodeMap[weatherDesc] || '01',
        temperature: {
          min: minT?.parameter?.parameterName || 'N/A',
          max: maxT?.parameter?.parameterName || 'N/A'
        },
        rainProb: pop?.parameter?.parameterName || '0',
        uvi: currentUvi // 使用更安全的方式獲取的 UVI 值
      };
    }) || [];

    // 如果有指定日期，過濾該日期的資料
    const filteredData = date 
      ? processedWeatherData.filter(w => w.date === date)
      : processedWeatherData;

    return NextResponse.json({
      success: true,
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