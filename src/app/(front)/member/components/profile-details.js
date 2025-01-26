'use client';

import React from 'react';
export default function ProfileDetails() {
  return (
    <div className="profile-details">
      <h1>個人資料</h1>
      <div>
        <h2 className="section-title">登錄詳細信息</h2>
        <div className="detail-item">
          <p>
            電子郵件: <span>vW2Bb@gmail.com</span>
          </p>
          <button>更改密碼</button>
        </div>
        <div className="detail-item">
          <p>
            密碼: <span>**************</span>
          </p>
          <button>更改密碼</button>
        </div>
      </div>
      <div>
        <h2 className="section-title">個人資料</h2>
        <div className="profile-info">
          <div className="profile-text">
            <div className="detail-item">
              <p>
                您的姓名: <span>陳俊傑</span>
              </p>
            </div>
            <div className="detail-item">
              <p>
                您的暱稱: <span>職業露營人</span>
              </p>
            </div>
            <div className="detail-item">
              <p>
                您的出生日期: <span>2000/12/12</span>
              </p>
            </div>
            <div className="detail-item">
              <p>
                會員資格始於: <span>2024/12/12</span>
              </p>
            </div>
          </div>
          <div className="profile-image-container">
            <img src="/images/member/avatar1.png" width="120" height="120" />
            <button className="edit-button">編輯</button>
          </div>
        </div>
      </div>
      <div>
        <h2 className="section-title">聯絡方式</h2>
        <div className="detail-item">
          <p>
            電話號碼: <span>0941343924</span>
          </p>
          <button>更新資料</button>
        </div>
        <div className="detail-item">
          <p>
            住家地址: <span>南投縣草屯鎮中正路67號</span>
          </p>
          <button>更新地址</button>
        </div>
      </div>
    </div>
  );
}
