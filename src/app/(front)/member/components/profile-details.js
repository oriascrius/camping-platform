"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ClipLoader } from "react-spinners"; // 引入 react-spinners

export default function ProfileDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [levelName, setLevelName] = useState(""); // 會員等級名稱
  const [levelDescription, setLevelDescription] = useState(""); // 會員等級描述
  const [otherBenefits, setOtherBenefits] = useState(""); // 其他權益
  const [pointsToNextLevel, setPointsToNextLevel] = useState("0"); // 升級所需點數
  const [loading, setLoading] = useState(true); // 加載狀態
  const AVATAR_OPTIONS = [
    "avatar1.png",
    "avatar2.png",
    "avatar3.png",
    "avatar4.png",
    "avatar5.png",
    "default-avatar.png",
  ];

  useEffect(() => {
    if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
      });
      router.push("/auth/login");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    axios
      .get(`/api/member/profile/${userId}`) // 在 API 請求中包含 userId
      .then((response) => {
        const userData = response.data;
        if (!userData) {
          throw new Error("用戶資料加載失敗");
        }
        setProfile(userData);
        setName(userData.name);
        setAddress(userData.address);
        setPhone(userData.phone);
        setAvatar(userData.avatar);
        setLevelName(userData.level_name);
        setLevelDescription(userData.level_description);
        setOtherBenefits(userData.other_benefits);

        // 計算升級所需積分
        if (userData.level_id < 5) {
          setPointsToNextLevel(
            (userData.required_points - userData.points || 0).toString()
          );
        } else {
          setPointsToNextLevel("已達最高等級");
        }

        // 檢查點數是否達到下一階
        if (
          userData.level_id < 5 &&
          userData.points >= userData.required_points
        ) {
          const newLevelId = userData.level_id + 1;
          axios
            .put(`/api/member/profile/${userId}`, {
              ...userData,
              level_id: newLevelId,
            })
            .then((response) => {
              const updatedUserData = response.data;
              setProfile(updatedUserData);
              setLevelName(updatedUserData.level_name);
              setLevelDescription(updatedUserData.level_description);
              setOtherBenefits(updatedUserData.other_benefits);
              setPointsToNextLevel(
                (
                  updatedUserData.required_points - updatedUserData.points || 0
                ).toString()
              );
              // 自動刷新頁面
              window.location.reload();
            })
            .catch((error) => {
              console.error("更新等級失敗:", error);
            });
        }
        setLoading(false); // 數據加載完成
      })
      .catch((error) => {
        setLoading(false); // 數據加載完成
        console.error("There was an error fetching the profile!", error);
      });
  }, [session, status]);

  const handleUpdate = async () => {
    try {
      const result = await Swal.fire({
        title: "確定要更新資料嗎?",
        // iconHtml: '<img src="/images/icons/camping-alert.svg" width="50">',
        showCancelButton: true,
        confirmButtonColor: "#4A6B3D",
        cancelButtonColor: "#9B7A5A",
        confirmButtonText: "確認更新",
        cancelButtonText: "取消",
      });

      if (result.isConfirmed) {
        // 更新使用者資料
        const userId = session.user.id;
        if (password && user.login_type === "email") {
          const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
          if (!passwordRegex.test(password)) {
            await Swal.fire({
              title: "密碼無效",
              text: "密碼必須包含至少一個字母和一個數字，且長度至少為8位",
              confirmButtonColor: "#9B7A5A",
            });
            return;
          }
        }
        await axios.put(`/api/member/profile/${userId}`, {
          name,
          address,
          phone,
          avatar,
          password: user.login_type === "email" ? password : null, // 只有一般登入才更新密碼
          level_id: user.level_id,
        });

        await Swal.fire({
          title: "更新成功！",
          // iconHtml: '<img src="/images/icons/camping-success.svg" width="50">',
          confirmButtonColor: "#4A6B3D",
        });
      }
    } catch (error) {
      await Swal.fire({
        title: "更新失敗",
        text: "請稍後再試",
        // iconHtml: '<img src="/images/icons/camping-error.svg" width="50">',
        confirmButtonColor: "#9B7A5A",
      });
    }
  };

  const handleAvatarChange = async (selectedAvatar) => {
    try {
      const userId = session?.user?.id;

      const response = await axios.patch(
        `/api/member/profile/avatar/${userId}`,
        { avatar: selectedAvatar } // 確保只傳遞文件名
      );

      if (response.data.success) {
        // 更新本地狀態
        setAvatar(response.data.avatar);
        // 更新 session 中的用戶頭像
        session.user.avatar = response.data.avatar;
        // 關閉模態框
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("更新失敗:", error);
    }
  };

  // 根據 level_id 返回會員等級名稱
  const getLevelName = (levelId) => {
    switch (levelId) {
      case 1:
        return "新手";
      case 2:
        return "銅牌";
      case 3:
        return "銀牌";
      case 4:
        return "金牌";
      case 5:
        return "鑽石";
      default:
        return "未知等級";
    }
  };

  const getBadgeStyle = () => {
    const styles = {
      1: { color: "#8B4513", icon: "beginner.png" },
      2: { color: "#CD7F32", icon: "bronze.png" },
      3: { color: "#C0C0C0", icon: "silver.png" },
      4: { color: "#FFD700", icon: "gold.png" },
      5: { color: "#B9F2FF", icon: "diamond.gif" },
    };
    return styles[user.level_id] || styles[1];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) {
      return "無效日期";
    }
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const progress =
    user?.level_id < 5 ? (user?.points / user?.required_points) * 100 : 100;

  if (status === "loading" || loading || !user) {
    return (
      <div className="loading">
        <ClipLoader size={50} color={"#5b4034"} loading={loading} />
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* 等級信息區塊 */}
      <section className="profile-section level-info">
        <div className="level-header">
          <img src={`/images/member/${getBadgeStyle().icon}`} alt="等級圖標" />
          <h2>{levelName}</h2>
        </div>

        <div className="progress-bar">
          <div style={{ width: `${progress}%` }}></div>
        </div>

        <div className="points-grid">
          <div className="point-item">
            <label>當前積分</label>
            <div className="point-value">{user.points}</div>
          </div>
          <div className="point-item">
            <label>{user.level_id < 5 ? "升級需求" : "已達頂級"}</label>
            <div className="point-value">
              {user.level_id < 5 ? user.required_points : "∞"}
            </div>
          </div>
        </div>
      </section>

      {/* 賬號安全區塊 */}
      <section className="profile-section account-security">
        <h3>帳號安全</h3>
        <div className="form-group">
          <label>電子郵件</label>
          <p>{user.email} </p>
        </div>
        {user.login_type === "email" && (
          <div className="form-group">
            <label>修改密碼</label>
            <input
              type="password"
              placeholder="輸入新密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
      </section>

      {/* 個人信息區塊 */}
      <section className="profile-section personal-info">
        <h3>個人信息</h3>
        <div className="info-grid">
          <div className="form-group">
            <label>姓名</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>出生日期</label>
            <span>{formatDate(user.birthday)}</span>
          </div>
          <div className="form-group">
            <label>會員資格</label>
            <span>{formatDate(user.created_at)}</span>
          </div>
        </div>

        <div className="avatar-editor">
          <img
            src={
              `/images/member/${avatar}` || "/images/member/default-avatar.png"
            }
            alt="用戶頭像"
            className="avatar-image"
            width={100}
            height={100}
          />
          <button className="edit-btn" onClick={() => setIsModalOpen(true)}>
            <span>更換頭像</span>
          </button>
        </div>
      </section>

      {/* 聯絡方式區塊 */}
      <section className="profile-section contact-info">
        <h3>聯絡方式</h3>
        <div className="form-group">
          <label>電話號碼</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="form-group">
          <label>住家地址</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <button className="save-btn" onClick={handleUpdate}>
          保存修改
        </button>
      </section>

      {/* 頭像選擇模態框 */}
      {isModalOpen && (
        <div className="avatar-modal">
          {/* 保持原有模態框邏輯 */}
          <div className="modal-content">
            <span className="close" onClick={() => setIsModalOpen(false)}>
              ×
            </span>
            <h2>選擇頭像</h2>
            <div className="avatar-selection m-auto">
              {AVATAR_OPTIONS.map((img) => (
                <img
                  key={img}
                  src={`/images/member/${img}`} // 確保路徑正確
                  onClick={() => handleAvatarChange(img)}
                  style={{
                    border:
                      avatar === `/images/member/${img}`
                        ? "2px solid #5b4034"
                        : "none",
                  }}
                />
              ))}
            </div>
            {/* <button
              onClick={() => {
                setIsModalOpen(false);
                handleUpdate();
              }}
            >
              更新
            </button> */}
          </div>
        </div>
      )}
    </div>
  );
}
