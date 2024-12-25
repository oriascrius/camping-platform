// 創建一個通用的 API 錯誤處理函數
export const handleApiError = (error) => {
  if (error.response) {
    // 服務器回應的錯誤
    console.error('API 錯誤:', error.response.data);
    throw new Error(error.response.data.message || '服務器錯誤');
  } else if (error.request) {
    // 請求發送失敗
    console.error('網路錯誤:', error.request);
    throw new Error('網路連接失敗');
  } else {
    // 其他錯誤
    console.error('其他錯誤:', error.message);
    throw new Error('發生未知錯誤');
  }
}; 