// 表單驗證相關函數

// 驗證電子郵件格式
// 參數 email: 電子郵件地址
// 回傳: 布林值，true 表示格式正確，false 表示格式錯誤
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // 電子郵件格式正則表達式
  return regex.test(email);
};

// 驗證密碼長度
// 參數 password: 密碼字串
// 回傳: 布林值，true 表示長度符合要求（至少6位）
export const validatePassword = (password) => {
  return password.length >= 6;  // 密碼至少需要 6 個字符
};

// 驗證 OTP 格式
// 參數 otp: OTP 驗證碼
// 回傳: 布林值，true 表示格式正確（6位數字）
export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);  // 驗證是否為 6 位數字
};

// 檢查密碼強度
// 參數 password: 密碼字串
// 回傳: 包含密碼強度資訊的物件
export const checkPasswordStrength = (password) => {
  const minLength = 8;  // 最小長度要求
  const hasUpperCase = /[A-Z]/.test(password);    // 是否包含大寫字母
  const hasLowerCase = /[a-z]/.test(password);    // 是否包含小寫字母
  const hasNumbers = /\d/.test(password);         // 是否包含數字
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);  // 是否包含特殊字符

  // 檢查各項條件
  const checks = {
    length: password.length >= minLength,  // 長度檢查
    upperCase: hasUpperCase,               // 大寫字母檢查
    lowerCase: hasLowerCase,               // 小寫字母檢查
    numbers: hasNumbers,                   // 數字檢查
    specialChars: hasSpecialChars         // 特殊字符檢查
  };

  return {
    isStrong: Object.values(checks).filter(Boolean).length >= 4,  // 至少符合 4 項條件才算強密碼
    checks,                                                       // 詳細檢查結果
    score: Object.values(checks).filter(Boolean).length           // 密碼強度分數（0-5）
  };
};

// 驗證註冊資料
// 參數 data: 註冊表單資料物件
// 回傳: 驗證結果物件，包含是否通過驗證及錯誤訊息
export const validateRegisterData = (data) => {
  const errors = {};
  
  // 驗證電子郵件
  if (!data.email || !validateEmail(data.email)) {
    errors.email = '請輸入有效的電子郵件';
  }
  
  // 驗證密碼
  if (!data.password || !validatePassword(data.password)) {
    errors.password = '密碼至少需要6個字符';
  }
  
  // 驗證姓名
  if (!data.name || data.name.length < 2) {
    errors.name = '請輸入姓名';
  }
  
  // 驗證手機號碼
  if (!data.phone) {
    errors.phone = '請輸入手機號碼';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,  // 是否所有驗證都通過
    errors                                      // 錯誤訊息物件
  };
};