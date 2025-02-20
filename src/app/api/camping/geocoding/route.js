/**
 * 地址轉換經緯度 API
 * 使用 OpenStreetMap 的 Nominatim 服務將地址轉換為經緯度座標
 * 
 * 使用方式：
 * GET /api/camping/geocoding?address=台北市信義區信義路五段7號
 * 
 * 回傳格式：
 * {
 *   success: true,
 *   latitude: 25.033976,
 *   longitude: 121.564126,
 *   displayName: "台北 101, 信義路五段7號, 西村里, 信義區, 台北市, 11049, 台灣"
 * }
 */

export async function GET(request) {
  // 解析請求 URL 中的查詢參數
  const { searchParams } = new URL(request.url);
  
  // 從查詢參數中取得地址
  // 例如：/api/camping/geocoding?address=台北市信義區信義路五段7號
  const address = searchParams.get('address');

  // 驗證地址參數
  if (!address) {
    return Response.json({ 
      success: false, 
      error: '地址不能為空' 
    });
  }

  try {
    // 呼叫 OpenStreetMap 的 Nominatim API 服務
    // Nominatim 是免費的地理編碼服務，可將地址轉換為經緯度
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      // 指定回傳 JSON 格式
      `format=json&` +
      // 將地址進行 URL 編碼並加入查詢字串
      `q=${encodeURIComponent(address)}` +
      // 限定只搜尋台灣的地址（tw 為台灣的國家代碼）
      `&countrycodes=tw` +
      // 限制只回傳最相關的一筆結果
      `&limit=1`
    );

    // 解析 API 回傳的 JSON 資料
    const data = await response.json();

    // 檢查是否有找到地址對應的經緯度
    if (data && data[0]) {
      // 如果成功找到結果，回傳經緯度資訊
      return Response.json({
        success: true,
        // 將經緯度從字串轉換為數字型態
        latitude: parseFloat(data[0].lat),   // 緯度
        longitude: parseFloat(data[0].lon),  // 經度
        // 回傳 OpenStreetMap 格式化的完整地址
        displayName: data[0].display_name
      });
    }

    // 若找不到對應的經緯度，回傳錯誤訊息
    return Response.json({
      success: false,
      error: '無法找到該地址的座標'
    });

  } catch (error) {
    // 發生錯誤時記錄到主控台
    console.error('地理編碼錯誤:', error);
    
    // 回傳錯誤訊息給客戶端
    return Response.json({
      success: false,
      error: '地理編碼服務錯誤'
    });
  }
}

/**
 * 使用注意事項：
 * 1. OpenStreetMap 使用限制：
 *    - 每秒最多 1 次請求
 *    - 建議加入快取機制
 *    - 需要遵守 OpenStreetMap 的使用條款
 * 
 * 2. 建議改進項目：
 *    - 實作請求頻率限制
 *    - 加入地址結果快取
 *    - 新增重試機制
 *    - 考慮使用備用地理編碼服務
 * 
 * 3. 錯誤處理：
 *    - 地址格式錯誤
 *    - API 服務無回應
 *    - 找不到對應座標
 *    - 網路連線問題
 */ 