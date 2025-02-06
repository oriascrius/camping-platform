// ===== 通用提示訊息服務 =====
import Swal from 'sweetalert2';

// 基本設定
const defaultOptions = {
  confirmButtonColor: '#6B8E7B',
  cancelButtonColor: '#6b7280',
};

// 成功提示（自動關閉）
export const showSuccess = async (title, text = '') => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 1500,
    showConfirmButton: false,
    ...defaultOptions
  });
};

// 錯誤提示
export const showError = async (title, text) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: '確定',
    ...defaultOptions
  });
};

// 需要確認的提示
export const showConfirm = async (title, text) => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    ...defaultOptions
  });
};

// 登入相關提示
export const showLoginAlert = {
  // 登入失敗
  failure: async () => {
    return showError(
      '登入失敗',
      '電子郵件或密碼錯誤，請重新確認'
    );
  },
  
  // 登入成功
  success: async () => {
    return showSuccess(
      '登入成功',
      '歡迎回來！'
    );
  },
  
  // 系統錯誤
  error: async () => {
    return showError(
      '系統錯誤',
      '登入時發生錯誤，請稍後再試'
    );
  }
};

// 註冊相關提示
export const showRegisterAlert = {
  // 註冊成功
  success: async () => {
    return showSuccess(
      '註冊成功！',
      '歡迎加入我們的露營社群'
    );
  },
  
  // 註冊失敗
  failure: async (message) => {
    return showError(
      '註冊失敗',
      message || '註冊時發生錯誤，請稍後再試'
    );
  },
  
  // 系統錯誤
  error: async () => {
    return showError(
      '系統錯誤',
      '註冊時發生錯誤，請稍後再試'
    );
  },

  // Email 已存在
  emailExists: async () => {
    return showError(
      '註冊失敗',
      '此電子信箱已被註冊'
    );
  }
};

// 忘記密碼相關提示
export const showForgotPasswordAlert = {
  // 發送驗證碼成功
  sendOTPSuccess: async () => {
    return showSuccess(
      '驗證碼已發送',
      '請查看您的信箱'
    );
  },

  // 驗證碼驗證成功
  verifyOTPSuccess: async () => {
    return showSuccess(
      '驗證成功',
      '請設定新密碼'
    );
  },

  // 重設密碼成功
  resetSuccess: async () => {
    return showSuccess(
      '密碼重設成功',
      '請使用新密碼登入'
    );
  },

  // 信箱未註冊
  emailNotFound: async () => {
    return showError(
      '信箱未註冊',
      '此信箱尚未註冊，請確認後重試'
    );
  },

  // 驗證碼錯誤
  invalidOTP: async () => {
    return showError(
      '驗證碼無效',
      '請確認驗證碼是否正確'
    );
  },

  // 系統錯誤
  error: async (message = '操作失敗，請稍後再試') => {
    return showError(
      '系統錯誤',
      message
    );
  }
};

// 新增購物車相關提示
export const showCartAlert = {
  // 成功提示
  success: async (title, text = '') => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 1500,
      showConfirmButton: false,
      ...defaultOptions
    });
  },

  // 錯誤提示
  error: async (title, text = '') => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 確認對話框
  confirm: async (title, text) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      ...defaultOptions
    });
  }
}; 