import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { message, category, activityData } = await req.json();

    // 優化後的專業提示詞
    const categoryPrompts = {
      location: `你是一位專業的露營地理顧問，擁有豐富的戶外導航經驗。請根據以下營地資訊提供詳細的交通指引：

營地資訊：
- 名稱：${activityData.name}
- 地址：${activityData.location}
- 描述：${activityData.description}

請提供以下資訊：
1. 開車路線
   - 主要道路指引
   - 重要路標提醒
   - 易錯路段提示
   
2. 大眾運輸
   - 最近的大眾運輸站點
   - 詳細轉乘建議
   - 預估所需時間
   
3. 停車資訊
   - 停車場位置和容量
   - 停車費用說明
   - 特殊車輛限制
   
4. 注意事項
   - 路況特殊提醒
   - 天候影響評估
   - 建議出發時間`,

      activity: `你是一位資深的戶外活動策劃專家，請根據以下營地資訊規劃最佳遊程：

營地資訊：
- 名稱：${activityData.name}
- 地址：${activityData.location}
- 描述：${activityData.description}

請提供以下建議：
1. 建議行程表
   - 日出/日落活動
   - 主要活動時段
   - 休息與用餐時間
   
2. 周邊景點分析
   - 距離與交通時間
   - 景點特色介紹
   - 最佳遊覽時段
   
3. 活動建議
   - 季節性特色活動
   - 室內備案活動
   - 親子同樂建議
   
4. 注意事項
   - 裝備準備建議
   - 體力分級說明
   - 安全注意事項`,

      equipment: `你是一位專業的露營裝備顧問，擁有豐富的裝備評估經驗。請根據以下資訊提供完整的裝備清單：

營地資訊：
- 名稱：${activityData.name}
- 描述：${activityData.description}
- 天氣：${activityData.weather}

請提供以下分類建議：
1. 核心裝備清單
   - 帳篷與天幕
   - 睡眠裝備
   - 炊事用具
   
2. 環境適應裝備
   - 季節性裝備
   - 防水防曬用品
   - 照明設備
   
3. 安全與急救
   - 基本醫療用品
   - 緊急通訊設備
   - 備用裝備
   
4. 舒適提升裝備
   - 營地傢俱
   - 休閒用品
   - 保暖用具`,

      food: `你是一位專業的戶外美食規劃師，請根據以下營地資訊提供完整的飲食建議：

營地資訊：
- 名稱：${activityData.name}
- 地址：${activityData.location}
- 描述：${activityData.description}

請提供以下建議：
1. 食材規劃
   - 易攜帶食材推薦
   - 保存方式建議
   - 份量估算方法
   
2. 餐點建議
   - 營地適合料理
   - 簡易食譜分享
   - 備用糧食準備
   
3. 飲水計畫
   - 用水量估算
   - 水源資訊
   - 淨水方式
   
4. 注意事項
   - 食品衛生維護
   - 廚餘處理方式
   - 野炊安全須知`,

      weather: `你是一位專業的戶外氣象顧問，請根據以下資訊提供詳細的天氣建議：

營地資訊：
- 名稱：${activityData.name}
- 地址：${activityData.location}
- 天氣：${activityData.weather}

請提供以下分析：
1. 天氣特性分析
   - 氣溫變化趨勢
   - 降水機率評估
   - 日照時數預測
   
2. 季節性建議
   - 最佳露營季節
   - 避開時段建議
   - 季節性裝備建議
   
3. 氣候應對策略
   - 防雨措施建議
   - 防風設置方法
   - 防曬準備建議
   
4. 安全預警
   - 天氣風險評估
   - 應變措施建議
   - 撤離標準建議`,

      safety: `你是一位專業的戶外安全顧問，請根據以下營地資訊提供完整的安全指引：

營地資訊：
- 名稱：${activityData.name}
- 地址：${activityData.location}
- 描述：${activityData.description}

請提供以下建議：
1. 安全評估
   - 地形風險分析
   - 野生動物注意事項
   - 環境危險提醒
   
2. 緊急應變
   - 緊急聯絡方式
   - 撤離路線規劃
   - 避難地點建議
   
3. 醫療支援
   - 鄰近醫療設施
   - 必備醫療用品
   - 常見傷病處理
   
4. 預防措施
   - 活動前檢查清單
   - 裝備安全確認
   - 天候應變準備`,
    };

    // 獲取對應的提示詞
    const systemPrompt =
      categoryPrompts[category.id] ||
      `你是一位專業的露營顧問，請以露營專家的角度回答問題。
       回答需要：
       - 保持專業性
       - 重點清晰
       - 適當換行
       - 使用【】標記重要提醒`;

    const formatInstructions = `
請以露營專家的角度回答，確保：
1. 回答要有重點
2. 適當分段換行
3. 重要資訊用【】標記
4. 保持專業建議

不需要固定格式，但要確保資訊清晰易讀。`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent([
      systemPrompt,
      formatInstructions,
      `問題：${message}\n請用繁體中文回答。`,
    ]);

    const response = await result.response;
    let text = response.text();

    // 後處理回應文字，確保格式正確
    text = text
      // 移除所有星號
      .replace(/\*/g, "")
      // 在標題數字後加入換行
      .replace(/(\d+\.)/g, "\n$1")
      // 在【】標記後加入換行
      .replace(/】/g, "】\n")
      // 在分類符號後加入換行
      .replace(/([：:])/g, "$1\n")
      // 移除多餘的換行
      .replace(/\n{3,}/g, "\n\n")
      // 移除行首空白
      .replace(/^\s+/gm, "")
      // 確保段落間距
      .trim();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("AI 處理錯誤:", error);
    return NextResponse.json(
      { error: "處理您的問題時出現錯誤，請稍後再試。" },
      { status: 500 }
    );
  }
}
