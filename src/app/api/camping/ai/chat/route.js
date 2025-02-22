import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { message, category, activityData } = await req.json();

    // 修改提示詞，要求更結構化的回答
    const categoryPrompts = {
      location: `你是一個專業的露營地點顧問。請根據以下營地資訊回答交通相關問題：
        營地名稱：${activityData.name}
        地址：${activityData.location}
        描述：${activityData.description}
        請提供具體的交通建議，包括開車路線、大眾運輸選擇和停車資訊。`,

      activity: `你是一個專業的露營活動顧問。請根據以下營地資訊回答活動相關問題：
        營地名稱：${activityData.name}
        地址：${activityData.location}
        描述：${activityData.description}
        請提供適合的活動建議，包括推薦行程、周邊景點和適合的參與者類型。`,

      equipment: `你是一個專業的露營裝備顧問。請根據以下營地資訊回答裝備相關問題：
        營地名稱：${activityData.name}
        描述：${activityData.description}
        天氣狀況：${activityData.weather}
        
        請提供詳細的裝備建議，並依照以下格式回答：
        
        1. 必備裝備：
           - 項目1
           - 項目2
           - 項目3
        
        2. 特殊需求：
           - 需求1
           - 需求2
           - 需求3
        
        3. 營地設施：
           - 設施1
           - 設施2
           - 設施3
        
        4. 注意事項：
           - 事項1
           - 事項2
           - 事項3`,

      food: `你是一個專業的露營美食顧問。請根據以下營地資訊回答飲食相關問題：
        營地名稱：${activityData.name}
        地址：${activityData.location}
        描述：${activityData.description}
        請提供飲食建議，包括附近美食、烤肉規定和食材準備建議。`,

      weather: `你是一個專業的露營天氣顧問。請根據以下營地資訊回答天氣相關問題：
        營地名稱：${activityData.name}
        地址：${activityData.location}
        天氣狀況：${activityData.weather}
        請提供天氣相關建議，包括季節性特點、注意事項和最佳露營時機。`,

      safety: `你是一個專業的露營安全顧問。請根據以下營地資訊回答安全相關問題：
        營地名稱：${activityData.name}
        地址：${activityData.location}
        描述：${activityData.description}
        請提供安全建議，包括注意事項、緊急措施和附近醫療設施資訊。`
    };

    // 獲取對應的提示詞
    const systemPrompt = categoryPrompts[category.id] || 
      `你是一個專業的露營顧問，請根據提供的資訊回答問題。
       請使用數字條列式（1. 2. 3. 4.）回答。
       每個重點需換行。
       相關類別的內容請用數字標題分類。`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent([
      systemPrompt,
      `問題：${message}\n請用繁體中文回答，使用條列式回答，確保格式清晰易讀。`
    ]);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });

  } catch (error) {
    console.error('AI 處理錯誤:', error);
    return NextResponse.json(
      { error: '處理您的問題時出現錯誤，請稍後再試。' },
      { status: 500 }
    );
  }
}
