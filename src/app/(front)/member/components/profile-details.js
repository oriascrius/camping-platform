"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

export default function ProfileDetails() {
  const { data: session, status } = useSession();
  const [user, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      console.error("No session found");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    axios
      .get(`/api/member/profile/${userId}`) // 在 API 請求中包含 userId
      .then((response) => {
        setProfile(response.data);
        setName(response.data.name);
        setNickname(response.data.nickname);
        setAddress(response.data.address);
        setPhone(response.data.phone);
        setAvatar(response.data.avatar);
      })
      .catch((error) => {
        console.error("There was an error fetching the profile!", error);
      });
  }, [session, status]);

  const handleUpdate = async () => {
    try {
      const userId = session.user.id;
      const response = await axios.put(`/api/member/profile/${userId}`, {
        name,
        nickname,
        address,
        phone,
        avatar,
        password,
      });
      alert(response.data.message);
    } catch (error) {
      console.error("更新失敗:", error);
      alert("更新失敗");
    }
  };

  const handleAvatarChange = (newAvatar) => {
    setAvatar(newAvatar);
  };

  if (status === "loading" || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-details">
      <h1>個人資料</h1>
      <div>
        <h2 className="section-title">登錄詳細信息</h2>
        <div className="detail-item">
          <p>
            電子郵件: <span>{user.email}</span>
          </p>
        </div>
        <div className="detail-item">
          <p>
            密碼: <span>**************</span>
          </p>
          <input
            type="password"
            placeholder="輸入新密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleUpdate}>更改密碼</button>
        </div>
      </div>
      <div>
        <h2 className="section-title">個人資料</h2>
        <div className="profile-info">
          <div className="profile-text">
            <div className="detail-item">
              <p>
                您的姓名:{" "}
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </p>
            </div>
            <div className="detail-item">
              <p>
                您的暱稱:{" "}
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </p>
            </div>
            <div className="detail-item">
              <p>
                您的出生日期: <span>{user.birthday}</span>
              </p>
            </div>
            <div className="detail-item">
              <p>
                會員資格始於: <span>{user.created_at}</span>
              </p>
            </div>
          </div>
          <div className="profile-image-container">
            <img src={`/images/member/${avatar}`} width="120" height="120" />
            <button
              className="edit-button"
              onClick={() => setIsModalOpen(true)}
            >
              編輯
            </button>
          </div>
        </div>
      </div>
      <div>
        <h2 className="section-title">聯絡方式</h2>
        <div className="detail-item">
          <p>
            電話號碼:{" "}
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </p>
          <button onClick={handleUpdate}>更新資料</button>
        </div>
        <div className="detail-item">
          <p>
            住家地址:{" "}
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </p>
          <button onClick={handleUpdate}>更新地址</button>
        </div>
      </div>

      {/* 模態框 */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsModalOpen(false)}>
              &times;
            </span>
            <h2>選擇頭像</h2>
            <div className="avatar-selection">
              {[
                "avatar1.png",
                "avatar2.png",
                "avatar3.png",
                "avatar4.png",
                "avatar5.png",
              ].map((img) => (
                <img
                  key={img}
                  src={`/images/member/${img}`}
                  width="50"
                  height="50"
                  onClick={() => handleAvatarChange(img)}
                  style={{
                    cursor: "pointer",
                    border: avatar === img ? "2px solid blue" : "none",
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => {
                setIsModalOpen(false);
                handleUpdate();
              }}
            >
              更新
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
