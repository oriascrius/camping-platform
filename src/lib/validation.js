// 表單驗證
export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  export const validatePassword = (password) => {
    return password.length >= 6;
  };
  
  export const validateRegisterData = (data) => {
    const errors = {};
    
    if (!data.email || !validateEmail(data.email)) {
      errors.email = '請輸入有效的電子郵件';
    }
    
    if (!data.password || !validatePassword(data.password)) {
      errors.password = '密碼至少需要6個字符';
    }
    
    if (!data.name || data.name.length < 2) {
      errors.name = '請輸入姓名';
    }
    
    if (!data.phone) {
      errors.phone = '請輸入手機號碼';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };