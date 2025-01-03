'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { 
  HiOutlineLogout, 
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineUserCircle,
  HiOutlineLockClosed
} from 'react-icons/hi';
import SettingsModal from './SettingsModal';

export default function OwnerHeader() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [ownerData, setOwnerData] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null
  });

  // 當組件載入時獲取營主資料
  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const response = await fetch('/api/owner/profile');
        if (!response.ok) {
          throw new Error('獲取資料失敗');
        }
        const data = await response.json();
        console.log('API 回傳資料:', data); // 檢查 API 回傳的資料
        setOwnerData(data); // 直接設置資料，不需要處理陣列
      } catch (error) {
        console.error('獲取資料錯誤:', error);
      }
    };

    if (session?.user) {  // 確保有登入資訊才獲取資料
      fetchOwnerData();
    }
  }, [session]);

  const handleModalOpen = (type) => {
    setModalConfig({ isOpen: true, type });
    setShowDropdown(false);
  };

  const handleModalClose = () => {
    setModalConfig({ isOpen: false, type: null });
  };

  return (
    <div className="absolute top-6 right-[calc(2rem+256px)] z-50">
      <div className="flex items-center space-x-4">
        {/* 使用者身份與 ID */}
        <div className="flex items-center space-x-2.5 text-[#2C4A3B] text-base">
          <HiOutlineUserCircle className="w-5 h-5" />
          <span className="font-medium text-[15px]">營主：</span>
          <span className="text-[15px]">{session?.user?.name || '88888'}</span>
        </div>

        {/* 設定按鈕 */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center
                     hover:bg-white transition-all duration-200 shadow-sm
                     hover:shadow-md text-[#2C4A3B] font-medium border border-[#A8C2B5]/20"
          >
            <HiOutlineCog className="w-6 h-6" />
          </button>

          {/* 下拉選單 */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2.5 w-44 rounded-lg 
                          bg-white shadow-lg border border-[#A8C2B5]/20">
              {/* 個人資料 */}
              <button 
                onClick={() => handleModalOpen('profile')}
                className="w-full flex items-center px-5 py-3.5 text-[15px] text-[#2C4A3B]
                         hover:bg-[#A8C2B5]/10 transition-colors duration-150
                         border-b border-[#A8C2B5]/10"
              >
                <HiOutlineUser className="w-5 h-5 mr-3" />
                <span>個人資料</span>
              </button>

              {/* 修改密碼 */}
              <button 
                onClick={() => handleModalOpen('password')}
                className="w-full flex items-center px-5 py-3.5 text-[15px] text-[#2C4A3B]
                         hover:bg-[#A8C2B5]/10 transition-colors duration-150
                         border-b border-[#A8C2B5]/10"
              >
                <HiOutlineLockClosed className="w-5 h-5 mr-3" />
                <span>修改密碼</span>
              </button>

              {/* 登出按鈕 */}
              <button
                onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
                className="w-full flex items-center px-5 py-3.5 text-[15px] text-[#2C4A3B]
                         hover:bg-[#A8C2B5]/10 transition-colors duration-150"
              >
                <HiOutlineLogout className="w-5 h-5 mr-3" />
                <span>登出系統</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal 組件 */}
      <SettingsModal 
        isOpen={modalConfig.isOpen}
        onClose={handleModalClose}
        type={modalConfig.type}
        ownerData={ownerData}
      />
    </div>
  );
} 