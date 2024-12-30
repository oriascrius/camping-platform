// 日期和時間相關
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// OTP 相關
export const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

export const isOTPExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

// 其他通用工具函數
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const formatError = (error) => {
  if (typeof error === 'string') return error;
  return error.message || '發生未知錯誤';
}; 