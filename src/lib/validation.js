// 表單驗證
export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  export const validatePassword = (password) => {
    return password.length >= 6;
  };
  
  export const validateOTP = (otp) => {
    return /^\d{6}$/.test(otp);
  };
  
  export const checkPasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const checks = {
      length: password.length >= minLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      numbers: hasNumbers,
      specialChars: hasSpecialChars
    };

    return {
      isStrong: Object.values(checks).filter(Boolean).length >= 4,
      checks,
      score: Object.values(checks).filter(Boolean).length
    };
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