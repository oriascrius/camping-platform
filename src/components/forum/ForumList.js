import React, { useState } from 'react'

const ForumList = () => {
  // 使用 useState 來追蹤當前選中的選項
  const [activeMenu, setActiveMenu] = useState('全部')

  // 當用戶點擊某個選項時，更新 activeMenu
  const handleMenuClick = (menu) => {
    setActiveMenu(menu)
  }

  return (
    <div className="forumList">
      <div className="forumMenu d-flex justify-content-center">
        {/* 動態設定 className 根據 activeMenu */}
        <div
          className={`forumMenuBtn ${activeMenu === '全部' ? 'active' : ''}`}
          onClick={() => handleMenuClick('全部')}
        >
          全部
        </div>
        <div
          className={`forumMenuBtn ${
            activeMenu === '好物分享' ? 'active' : ''
          }`}
          onClick={() => handleMenuClick('好物分享')}
        >
          好物分享
        </div>
        <div
          className={`forumMenuBtn ${
            activeMenu === '營地見聞' ? 'active' : ''
          }`}
          onClick={() => handleMenuClick('營地見聞')}
        >
          營地見聞
        </div>
        <div
          className={`forumMenuBtn ${
            activeMenu === '活動揪團' ? 'active' : ''
          }`}
          onClick={() => handleMenuClick('活動揪團')}
        >
          活動揪團
        </div>
        <div
          className={`forumMenuBtn ${
            activeMenu === '露營知識' ? 'active' : ''
          }`}
          onClick={() => handleMenuClick('露營知識')}
        >
          露營知識
        </div>
        <div
          className={`forumMenuBtn ${
            activeMenu === '露友閒聊' ? 'active' : ''
          }`}
          onClick={() => handleMenuClick('露友閒聊')}
        >
          露友閒聊
        </div>
      </div>
    </div>
  )
}

export default ForumList
