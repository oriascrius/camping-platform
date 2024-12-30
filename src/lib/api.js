// 統一的 API 錯誤處理
export const handleApiError = (error) => {
  if (error.response) {
    console.error('API 錯誤:', error.response.data);
    throw new Error(error.response.data.message || '服務器錯誤');
  } else if (error.request) {
    console.error('網路錯誤:', error.request);
    throw new Error('網路連接失敗');
  } else {
    console.error('其他錯誤:', error.message);
    throw new Error('發生未知錯誤');
  }
};

// API 請求輔助函數
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '請求失敗');
    }
    
    return data;
  } catch (error) {
    handleApiError(error);
  }
}; 