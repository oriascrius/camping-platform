import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 初始化 Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { message, activityData } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 建立更豐富的營地相關資訊
    const campingContext = `
當前營地詳細資訊：
1. 基本資料
   - 營地名稱：${activityData.name}
   - 地點：${activityData.location}
   - 海拔高度：${activityData.altitude || '未提供'} 公尺
   - 營地面積：${activityData.area || '未提供'} 平方公尺
   - 營位數量：${activityData.capacity || '未提供'} 個

2. 環境資訊
   - 目前天氣：${activityData.weather}
   - 氣溫範圍：${activityData.temperature || '未提供'}
   - 降雨機率：${activityData.rainChance || '未提供'}%
   - 地形特色：${activityData.terrain || '未提供'}
   - 植被類型：${activityData.vegetation || '未提供'}

3. 設施配備
   - 供電設施：${activityData.electricity || '未提供'}
   - 供水設施：${activityData.water || '未提供'}
   - 衛浴設備：${activityData.bathroom || '未提供'}
   - 遮雨棚：${activityData.shelter || '未提供'}
   - 烤肉設施：${activityData.bbq || '未提供'}
   - 停車空間：${activityData.parking || '未提供'}

4. 周邊資源
   - 最近醫療設施：${activityData.nearbyHospital || '未提供'}
   - 最近商店：${activityData.nearbyStore || '未提供'}
   - 景點距離：${activityData.attractions || '未提供'}
   - 緊急聯絡資訊：${activityData.emergency || '未提供'}

5. 營地規範
   - 營地守則：${activityData.rules || '未提供'}
   - 寧靜時段：${activityData.quietTime || '未提供'}
   - 入營時間：${activityData.checkIn || '未提供'}
   - 退營時間：${activityData.checkOut || '未提供'}
   - 特殊限制：${activityData.restrictions || '未提供'}

6. 活動資訊
   - 可進行活動：${activityData.activities || '未提供'}
   - 季節特色：${activityData.seasonalFeatures || '未提供'}
   - 推薦行程：${activityData.recommendedItinerary || '未提供'}
   - 體驗活動：${activityData.experiences || '未提供'}

7. 安全考量
   - 地形風險：${activityData.terrainRisks || '未提供'}
   - 野生動物：${activityData.wildlife || '未提供'}
   - 緊急避難處：${activityData.shelter || '未提供'}
   - 通訊訊號：${activityData.signal || '未提供'}

8. 營地特色
   - 適合對象：${activityData.suitableFor || '未提供'}
   - 最佳季節：${activityData.bestSeason || '未提供'}
   - 特色設施：${activityData.specialFacilities || '未提供'}
   - 營地評分：${activityData.rating || '未提供'}

營地描述：
${activityData.description}

請根據以上營地資訊和專業知識，針對用戶的問題「${message}」提供詳細的回答。回答時請：
1. 結合營地特色給予建議
2. 考慮當前天氣狀況
3. 提供符合營地規範的活動建議
4. 注意安全事項提醒
5. 善用周邊資源資訊
6. 提供時間規劃建議
7. 考慮季節性因素
8. 提供具體可行的建議`;

    // 生成回應
    const result = await model.generateContent(campingContext);
    const response = await result.response;

    // 錯誤處理增強
    if (!response.text()) {
      throw new Error("AI 回應內容為空");
    }

    return NextResponse.json({
      response: response.text(),
      success: true,
    });

  } catch (error) {
    console.error("Gemini API Error:", error);

    // 更詳細的錯誤處理
    if (error.response) {
      // API 回傳的錯誤
      return NextResponse.json(
        { 
          error: "AI 服務暫時無法使用，請稍後再試",
          details: error.response.data,
          success: false 
        },
        { status: error.response.status }
      );
    } else if (error.request) {
      // 網路問題
      return NextResponse.json(
        { 
          error: "網路連線問題，請檢查您的網路狀態",
          success: false 
        },
        { status: 503 }
      );
    } else {
      // 其他錯誤
      return NextResponse.json(
        { 
          error: "處理請求時發生錯誤，請稍後再試",
          details: error.message,
          success: false 
        },
        { status: 500 }
      );
    }
  }
}
