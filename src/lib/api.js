// 統一的 API 錯誤處理函數
export const handleApiError = (error) => {
  if (error.response) {
    // 伺服器回應了錯誤狀態碼
    // response.data 包含了錯誤詳情
    console.error('API 錯誤:', error.response.data);
    throw new Error(error.response.data.message || '伺服器錯誤');
  } else if (error.request) {
    // 請求已發送但沒有收到回應
    // error.request 是瀏覽器中的 XMLHttpRequest 實例
    console.error('網路錯誤:', error.request);
    throw new Error('網路連接失敗，請檢查網路狀態');
  } else {
    // 在設置請求時發生錯誤
    console.error('其他錯誤:', error.message);
    throw new Error('發生未知錯誤，請稍後再試');
  }
};

// API 請求輔助函數
export const apiRequest = async (url, options = {}) => {
  try {
    // 設定預設請求選項
    const response = await fetch(url, {
      ...options,  // 展開傳入的選項
      headers: {
        'Content-Type': 'application/json',  // 設定內容類型為 JSON
        ...options.headers,  // 合併自定義標頭
      },
    });
    
    // 解析回應內容為 JSON
    const data = await response.json();
    
    // 檢查回應狀態
    if (!response.ok) {
      // 如果狀態碼不是 2xx，拋出錯誤
      throw new Error(data.error || '請求失敗，請稍後再試');
    }
    
    // 回傳成功的資料
    return data;
  } catch (error) {
    // 使用統一的錯誤處理
    handleApiError(error);
  }
};

// 使用範例：
/*
// GET 請求
const getData = async () => {
  const data = await apiRequest('/api/some-endpoint');
  return data;
};

// POST 請求
const createData = async (payload) => {
  const data = await apiRequest('/api/some-endpoint', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data;
};

// 帶認證的請求
const getProtectedData = async () => {
  const data = await apiRequest('/api/protected-endpoint', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data;
};
*/ 