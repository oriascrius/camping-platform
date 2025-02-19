"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

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
      })
      .catch((error) => {
        console.error("There was an error fetching the profile!", error);
      });
  }, [session, status]);

  const handleUpdate = async () => {
    try {
      const result = await Swal.fire({
        title: "確定要更新資料嗎?",
        iconHtml: '<img src="/images/icons/camping-alert.svg" width="50">',
        showCancelButton: true,
        confirmButtonColor: "#4A6B3D",
        cancelButtonColor: "#9B7A5A",
        confirmButtonText: "確認更新",
        cancelButtonText: "取消",
      });

      if (result.isConfirmed) {
        // 更新使用者資料
        const userId = session.user.id;
        await axios.put(`/api/member/profile/${userId}`, {
          name,
          address,
          phone,
          avatar,
          password,
          level_id: user.level_id,
        });

        await Swal.fire({
          title: "更新成功！",
          iconHtml: '<img src="/images/icons/camping-success.svg" width="50">',
          confirmButtonColor: "#4A6B3D",
        });
      }
    } catch (error) {
      await Swal.fire({
        title: "更新失敗",
        text: "請稍後再試",
        iconHtml: '<img src="/images/icons/camping-error.svg" width="50">',
        confirmButtonColor: "#9B7A5A",
      });
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const userId = session.user.id;
      const response = await axios.post(
        `/api/member/profile/${userId}/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setAvatar(response.data.avatar);
      alert("頭像更新成功");
    } catch (error) {
      console.error("頭像更新失敗:", error);
      alert("頭像更新失敗");
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

  const LevelBadge = ({ level }) => {
    const getBadgeStyle = () => {
      const styles = {
        1: { color: "#8B4513", icon: "beginner.png" },
        2: { color: "#CD7F32", icon: "bronze.png" },
        3: { color: "#C0C0C0", icon: "silver.png" },
        4: { color: "#FFD700", icon: "gold.png" },
        5: { color: "#B9F2FF", icon: "diamond.gif" },
      };
      return styles[level] || styles[1];
    };

    const { color, icon } = getBadgeStyle();

    return (
      <div className="d-flex align-items-center ">
        <img
          src={`/images/member/${icon}`}
          alt="level icon"
          className="me-2 img-badge"
        />
        <span style={{ color, fontWeight: "bold" }}>{levelName}</span>
      </div>
    );
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

  if (status === "loading" || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-details">
      {/* 會員等級和積分 */}
      <div>
        <h2 className="section-title">
          會員等級
          <LevelBadge level={user.level_id} />
        </h2>

        <div className="detail-item">
          <p>
            積分: <span>{user.points?.toString() || "0"}</span>
          </p>
        </div>
        <div className="detail-item">
          <p>
            升級所需積分: <span>{pointsToNextLevel}</span>
          </p>
        </div>
        <div className="detail-item">
          <p>
            等級描述: <span>{levelDescription}</span>
          </p>
        </div>
        <div className="detail-item">
          <p>
            其他權益: <span>{otherBenefits}</span>
          </p>
        </div>
      </div>

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
                您的出生日期: <span>{formatDate(user.birthday)}</span>
              </p>
            </div>
            <div className="detail-item">
              <p>
                會員資格始於: <span>{formatDate(user.created_at)}</span>
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
            電話號碼:
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
              ×
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
                  onClick={() => setAvatar(img)}
                  style={{
                    cursor: "pointer",
                    border: avatar === img ? "2px solid blue" : "none",
                  }}
                />
              ))}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
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
