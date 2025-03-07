"use client";
// ===== React 相關引入 =====
import { useState, useEffect, useMemo } from "react"; // 引入 React 狀態管理和生命週期鉤子
import { useSession, signIn } from "next-auth/react"; // 引入使用者身份驗證功能

// ===== UI 組件和圖標引入 =====
import {
  FaEdit,
  FaTrash,
  FaHeart,
  FaRegHeart,
  FaReply,
  FaShare,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa"; // 引入編輯和刪除圖標組件

// ===== 自定義組件引入 =====
import StarRating from "./StarRating"; // 引入星級評分組件
// import DiscussionCarousel from "./DiscussionCarousel"; // 引入評論輪播展示組件

// ===== 自定義提示工具引入 =====
import { showDiscussionAlert } from "@/utils/sweetalert";

import {
  discussionToast, // 保留這個用於顯示提醒
} from "@/utils/toast";

import { motion, AnimatePresence } from "framer-motion"; // 需要安裝 framer-motion

export default function DiscussionSection({ activityId }) {
  const { data: session, status } = useSession();
  const [discussions, setDiscussions] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDiscussionId, setEditingDiscussionId] = useState(null);
  const [likedDiscussions, setLikedDiscussions] = useState(new Set());
  const [showReplyForm, setShowReplyForm] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'highest', 'lowest'
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_DISPLAY_COUNT = 3; // 預設顯示的評論數量
  const [replies, setReplies] = useState({}); // 儲存所有評論的回覆
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 添加初始載入狀態

  // 獲取評論列表
  const fetchDiscussions = async () => {
    try {
      setIsInitialLoading(true); // 設置載入狀態
      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setDiscussions(data.discussions);
      setAverageRating(data.averageRating);
      setTotalCount(data.total);
    } catch (error) {
      discussionToast.error("無法載入評論，請稍後再試");
      console.error("獲取評論失敗:", error);
    } finally {
      setIsInitialLoading(false); // 結束載入狀態
    }
  };

  // 獲取用戶ID的輔助函數
  const getUserId = (session) => {
    if (!session || !session.user) return null;
    
    // 如果有 userId 直接使用
    if (session.userId) {
      return session.userId;
    }
    
    return null;
  };

  // 獲取用戶名稱的輔助函數
  const getUserName = (session) => {
    if (!session || !session.user) return null;
    
    // 如果有 userName 直接使用
    if (session.userName) {
      return session.userName;
    }
    
    return '未設定名稱';
  };

  // 提交評論（新增或編輯）
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!session || !session.user) {
      discussionToast.warning("請先登入後再發布評論");
      return;
    }

    if (!content.trim()) {
      discussionToast.warning("請輸入評論內容");
      return;
    }

    setIsLoading(true);
    try {
      // 只發送後端需要的資料
      const discussionData = {
        content: content.trim(),
        rating: Number(rating)  // 確保 rating 是數字
      };

      // console.log('準備提交的評論數據:', discussionData);

      let res;
      if (editingDiscussionId) {
        res = await fetch(
          `/api/camping/activities/${activityId}/discussions/${editingDiscussionId}`,
          {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json"
            },
            body: JSON.stringify(discussionData),
          }
        );
      } else {
        res = await fetch(`/api/camping/activities/${activityId}/discussions`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify(discussionData),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "提交評論失敗");
      }

      discussionToast.success(
        editingDiscussionId ? "評論更新成功" : "評論發布成功"
      );
      
      setContent("");
      setRating(5);
      setEditingDiscussionId(null);
      fetchDiscussions();
    } catch (error) {
      console.error("評論提交錯誤:", error);
      discussionToast.error(error.message || "評論提交失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  // 編輯評論
  const handleEdit = (discussion) => {
    setContent(discussion.content);
    setRating(discussion.rating);
    setEditingDiscussionId(discussion.id);
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setContent("");
    setRating(5);
    setEditingDiscussionId(null);
    fetchDiscussions();
  };

  // 刪除評論
  const handleDelete = async (discussionId) => {
    // 使用 SweetAlert 顯示刪除確認
    const result = await showDiscussionAlert.confirmDelete();
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions/${discussionId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // 使用 Toast 顯示刪除成功提示
      discussionToast.success("評論已成功刪除");
      fetchDiscussions();
    } catch (error) {
      // 使用 SweetAlert 顯示系統錯誤
      await showDiscussionAlert.error(error.message || "刪除失敗，請稍後再試");
    }
  };

  // 處理點讚
  const handleLike = async (discussionId) => {
    if (!session) {
      await showDiscussionAlert.warning("請先登入後再進行點讚");
      return;
    }

    try {
      // 先樂觀更新 UI
      setLikedDiscussions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(discussionId)) {
          newSet.delete(discussionId);
        } else {
          newSet.add(discussionId);
        }
        return newSet;
      });

      // 更新點讚數量
      setDiscussions(prev => prev.map(disc => {
        if (disc.id === discussionId) {
          return {
            ...disc,
            likes_count: disc.likes_count + (likedDiscussions.has(discussionId) ? -1 : 1)
          };
        }
        return disc;
      }));

      // 呼叫後端 API
      const response = await fetch(`/api/camping/activities/discussions/${discussionId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('點讚失敗');
      }

      // 顯示成功提示
      discussionToast.success(
        likedDiscussions.has(discussionId) ? "已取消點讚" : "點讚成功"
      );

    } catch (error) {
      // 如果失敗，回復原始狀態
      setLikedDiscussions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(discussionId)) {
          newSet.delete(discussionId);
        } else {
          newSet.add(discussionId);
        }
        return newSet;
      });

      // 回復點讚數量
      setDiscussions(prev => prev.map(disc => {
        if (disc.id === discussionId) {
          return {
            ...disc,
            likes_count: disc.likes_count + (likedDiscussions.has(discussionId) ? 1 : -1)
          };
        }
        return disc;
      }));

      discussionToast.error("點讚失敗，請稍後再試");
    }
  };

  // 處理分享
  const handleShare = async (discussion) => {
    try {
      await navigator.share({
        title: "營地評論分享",
        text: `${discussion.content} - ${discussion.user_name}的評論`,
        url: window.location.href,
      });
    } catch (error) {
      // 如果瀏覽器不支援分享API，則複製連結
      navigator.clipboard.writeText(window.location.href);
      await showDiscussionAlert.shareSuccess();
    }
  };

  // 排序邏輯
  const getSortedDiscussions = (discussions, sortBy) => {
    const sortedDiscussions = [...discussions];
    
    switch (sortBy) {
      case 'newest':
        return sortedDiscussions.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      
      case 'highest':
        return sortedDiscussions.sort((a, b) => 
          b.rating - a.rating || // 先按評分排序
          new Date(b.created_at) - new Date(a.created_at) // 評分相同時按時間排序
        );
      
      case 'lowest':
        return sortedDiscussions.sort((a, b) => 
          a.rating - b.rating ||
          new Date(b.created_at) - new Date(a.created_at)
        );
        
      default:
        return sortedDiscussions;
    }
  };

  // 初始加載評論
  useEffect(() => {
    fetchDiscussions();
  }, [activityId]);

  // 找出用戶的評論
  const userDiscussion = useMemo(() => {
    if (!session || !discussions.length) return null;

    // 根據不同登入類型獲取正確的用戶ID
    const currentUserId = session.user?.id?.toString();
    const currentLineUserId = session.user?.line_user_id;

    return discussions.find(discussion => 
      // 檢查一般/Google登入的ID
      discussion.user_id?.toString() === currentUserId ||
      // 檢查 LINE 登入的ID
      discussion.user_id?.toString() === currentLineUserId
    );
  }, [session, discussions]);

  // 檢查是否是用戶自己的評論
  const isOwnDiscussion = (discussion) => {
    if (!session || !session.user) return false;

    const currentUserId = session.user.id?.toString();
    const currentLineUserId = session.user.line_user_id;
    const discussionUserId = discussion.user_id?.toString();

    return discussionUserId === currentUserId || 
           discussionUserId === currentLineUserId;
  };

  // 根據展開狀態決定顯示的評論
  const getDisplayedDiscussions = () => {
    const sortedDiscussions = getSortedDiscussions(discussions, sortBy);
    return isExpanded
      ? sortedDiscussions
      : sortedDiscussions.slice(0, INITIAL_DISPLAY_COUNT);
  };

  // 獲取特定討論的回覆列表
  const fetchReplies = async (discussionId) => {
    try {
      // console.log("正在獲取討論回覆:", discussionId); // 添加日誌

      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions/${discussionId}/replies`
      );
      const data = await res.json();

      if (!res.ok) {
        console.error("API 錯誤:", data.error, data.details); // 添加詳細錯誤信息
        throw new Error(data.error);
      }

      setReplies((prev) => ({
        ...prev,
        [discussionId]: data.replies,
      }));
    } catch (error) {
      console.error("獲取回覆失敗:", error);
      discussionToast.error("無法載入回覆，請稍後再試");
    }
  };

  // 處理回覆提交
  const handleReply = async (discussionId) => {
    if (!replyContent.trim()) return;
    
    try {
      setIsSubmittingReply(true);
      
      const response = await fetch(`/api/camping/activities/${activityId}/discussions/${discussionId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '回覆發送失敗');
      }

      const { reply } = await response.json();
      
      // 更新討論列表中的回覆
      setDiscussions(discussions.map(disc => {
        if (disc.id === discussionId) {
          return {
            ...disc,
            replies: [...(disc.replies || []), reply],
            replies_count: (disc.replies_count || 0) + 1
          };
        }
        return disc;
      }));

      // 清空回覆框
      setReplyContent('');
      setReplyingTo(null);
      
      discussionToast.success('回覆已發布');
      
    } catch (error) {
      console.error('Reply error:', error);
      discussionToast.error(error.message || '回覆發送失敗，請稍後再試');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // 在 useEffect 中加載回覆
  useEffect(() => {
    if (discussions.length > 0) {
      discussions.forEach((discussion) => {
        fetchReplies(discussion.id);
      });
    }
  }, [discussions]);

  // 在 useEffect 中獲取用戶已點讚的評論
  useEffect(() => {
    const fetchLikedDiscussions = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/camping/activities/discussions/likes');
          if (response.ok) {
            const data = await response.json();
            setLikedDiscussions(new Set(data.likedDiscussionIds));
          }
        } catch (error) {
          console.error('獲取點讚記錄失敗:', error);
        }
      }
    };

    fetchLikedDiscussions();
  }, [session]);

  // 用於調試的 useEffect
  // useEffect(() => {
  //   if (session && session.user) {
  //     console.log('用戶登入資訊:', {
  //       id: session.user.id,
  //       name: session.user.name,
  //       loginType: session.user.loginType,
  //       fullSession: session
  //     });
  //   }
  // }, [session]);

  // 過濾其他人的評論（排除自己的評論）
  const otherDiscussions = useMemo(() => {
    if (!session || !discussions.length) return discussions;
    
    // 根據不同登入類型獲取正確的用戶ID
    const currentUserId = session.user?.id?.toString();
    const currentLineUserId = session.user?.line_user_id;

    return discussions.filter(discussion => 
      discussion.user_id?.toString() !== currentUserId && 
      discussion.user_id?.toString() !== currentLineUserId
    );
  }, [session, discussions]);

  // 在 averageRating 附近添加星級統計函數
  const getRatingStats = () => {
    const stats = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    
    discussions.forEach(discussion => {
      stats[discussion.rating]++;
    });
    
    return stats;
  };

  // 在評論列表區域添加載入效果
  if (isInitialLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              className="h-8 w-8"
              animate={{
                rotate: 360
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <svg
                className="text-[#8B7355]"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4.75V6.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.5"
                />
                <path
                  d="M17.1266 6.87347L16.0659 7.93413"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                />
                <path
                  d="M19.25 12L17.75 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.7"
                />
                <path
                  d="M17.1266 17.1265L16.0659 16.0659"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />
                <path
                  d="M12 17.75V19.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
                <path
                  d="M7.9342 16.0659L6.87354 17.1265"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.25 12L4.75 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.9342 7.93413L6.87354 6.87347"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
            <span className="text-[#8B7355] font-medium">評論載入中...</span>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <motion.div
                key={index}
                className="h-24 bg-[#F0EBE8] rounded-lg"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 0.7 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: index * 0.2
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 評論區標題和篩選 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <motion.svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-[#8B7355]"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            animate={{
              scale: [1, 1.1, 1],
              y: [-1, 1, -1],
              rotate: [-3, 3, -3]
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" 
            />
          </motion.svg>
          <h2 className="text-xl font-bold text-[#8B7355] flex items-center gap-2 m-0">
            評論區
          </h2>
          <div className="ms-3 mt-2  text-[#9F9189] text-sm">
            {discussions.length > 0 && (
              <span>平均 {averageRating.toFixed(1)} 顆星 • {discussions.length} 則評論</span>
            )}
          </div>
        </div>

        {/* 排序選單 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#9F9189]">排序方式</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 
              text-sm text-[#8B7E7E]
              border border-[#E8E4DE] rounded-lg
              bg-white
              hover:border-[#D3CDC6]
              focus:outline-none focus:border-[#B6AD9A]
              cursor-pointer
              transition-colors"
          >
            <option value="newest">最新評論</option>
            <option value="highest">最高評分</option>
            <option value="lowest">最低評分</option>
          </select>
        </div>
      </div>

      {/* 添加評分統計圖表 */}
      <div className="bg-white p-6 rounded-lg border border-[#F0EBE8] mb-6">
        <div className="flex items-center gap-8">
          {/* 左側平均分數 */}
          <div className="text-center">
            <div className="text-4xl font-bold text-[#8B7355]">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-[#9F9189]">
              平均評分
            </div>
            <StarRating 
              value={Math.round(averageRating)} 
              readOnly 
              className="mt-2"
            />
            <div className="text-sm text-[#9F9189] mt-1">
              {discussions.length} 則評論
            </div>
          </div>

          {/* 右側分布圖表 */}
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = getRatingStats()[rating];
              const percentage = (count / discussions.length) * 100 || 0;
              
              return (
                <div key={rating} className="flex items-center gap-2 mb-2">
                  <div className="w-12 text-sm text-[#8B7355]">
                    {rating} 星
                  </div>
                  <div className="flex-1 h-6 bg-[#F0EBE8] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8B7355] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-[#9F9189]">
                    {count} 則 ({percentage.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 引導提示 */}
      {!session ? (
        <div className="text-sm text-[#9F9189] bg-[#FAF9F8] p-3 rounded-lg">
          ✨ <span className="text-[#B6AD9A]">登入</span>後即可分享您的露營體驗，幫助更多露友做選擇！
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-sm text-[#9F9189] bg-[#FAF9F8] p-3 rounded-lg">
          🏕️ 還沒有評論，成為第一位分享體驗的露友吧！
        </div>
      ) : null}

      {/* 評分和評論輸入區 */}
      {session ? (
        userDiscussion && !editingDiscussionId ? (
          // 已經評論過的提示 (當不在編輯模式時顯示)
          <div className="bg-[#FDFCFB] p-6 rounded-lg border border-[#E8E4DE]">
            <div className="flex items-center gap-3 text-[#9F9189]">
              <div className="w-10 h-10 rounded-full bg-[#F0EBE8] flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <p className="font-medium text-[#5D564D]">您已發表過評論</p>
                <p className="text-sm">
                  發表於 {new Date(userDiscussion.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // 評論輸入區 (用於新評論或編輯模式)
          <div className="bg-white p-6 rounded-lg border border-[#F0EBE8] space-y-4">
            {/* 編輯模式提示 */}
            {editingDiscussionId && (
              <div className="bg-[#FAF9F8] p-4 rounded-lg mb-4 border border-[#E8E4DE]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#B6AD9A] text-white px-2 py-1 rounded-lg text-sm">編輯模式</span>
                  <span className="text-[#9F9189]">✍️ 您正在編輯評論</span>
                </div>
                

                <ul className="text-sm text-[#8B7E7E] space-y-2 list-disc list-inside mb-0">
                  <li>您可以修改評分和評論內容</li>
                  <li>完成編輯後點擊「更新評論」</li>
                  <li>若要放棄修改，請點擊「取消編輯」</li>
                </ul>

                <div className="flex justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="text-[#9F9189] hover:text-[#8B7E7E] no-underline"
                  >
                    ← 取消編輯並返回
                  </button>
                </div>
              </div>
            )}
            
            {/* 字數提示 */}
            <div className="flex justify-between items-center text-sm text-[#9F9189] mb-2">
              <span>
                {editingDiscussionId ? '正在編輯您的評論' : '撰寫新評論'}
              </span>
              <span>
                {content.length}/500 字
              </span>
            </div>

            {/* 評分區域 */}
            <div className="flex items-center gap-2">
              <span className="text-[#8B7E7E]">評分</span>
              <StarRating 
                value={rating}
                onChange={setRating}
                readOnly={false}
              />
              <span className="text-sm text-[#9F9189] ml-2">
                {rating === 5 && "太棒了！"}
                {rating === 4 && "很好！"}
                {rating === 3 && "還不錯"}
                {rating === 2 && "有待改進"}
                {rating === 1 && "需要加油"}
              </span>
            </div>

            {/* 評論輸入區 */}
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setShowHint(true)}
                onBlur={() => setShowHint(false)}
                className="w-full px-3 py-2 
                  border border-[#F0EBE8] 
                  rounded-lg 
                  bg-white 
                  placeholder-[#BFB8B8]
                  outline-none
                  focus:border-[#B6AD9A]
                  hover:border-[#D3CDC6]
                  transition-all duration-200
                  resize-none"
                placeholder="分享您的體驗..."
                rows="4"
              />
              {content.length > 0 && (
                <div className="absolute bottom-2 right-2 text-sm text-[#9F9189]">
                  {content.length}/500
                </div>
              )}
            </div>

            {/* 發布按鈕 */}
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isLoading || content.length === 0}
                className={`px-6 py-2 rounded-lg text-white 
                  transition-all duration-200 flex items-center gap-2
                  ${content.length === 0 
                    ? 'bg-[#D3CDC6] cursor-not-allowed'
                    : 'bg-[#9F9189] hover:bg-[#8B7E7E] hover:shadow-md'
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>
                    {editingDiscussionId ? '更新中...' : '發布中...'}
                  </>
                ) : (
                  <>
                    {editingDiscussionId ? (
                      <>
                        <FaEdit className="w-4 h-4" />
                        更新評論
                      </>
                    ) : (
                      '發布評論'
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        )
      ) : (
        // 未登入提示
        <div className="bg-[#FDFCFB] p-6 rounded-lg border border-[#E8E4DE] text-center">
          <p className="text-[#9F9189] mb-3">登入後即可發表評論</p>
          <button 
            onClick={() => signIn()}
            className="px-6 py-2 bg-[#9F9189] text-white rounded-lg
              hover:bg-[#8B7E7E] transition-colors duration-200"
          >
            立即登入
          </button>
        </div>
      )}

      {/* 評論列表區域 */}
      <div className="mt-6 space-y-6">
        {/* 我的評論區塊 */}
        {session && userDiscussion && (
          <div className="bg-[#FDFCFB] p-4 rounded-lg border border-[#E8E4DE]">
            <div className="text-sm text-[#9F9189] mb-3 flex items-center gap-2">
              <span className="bg-[#B6AD9A] text-white px-2 py-0.5 rounded text-xs">我的評論</span>
              • 您已於 {new Date(userDiscussion.created_at).toLocaleDateString()} 發表評論
            </div>
            {/* 我的評論卡片 */}
            <motion.div className="bg-white p-4 rounded-lg border border-[#F0EBE8] relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-3">
                  {/* 用戶名稱和評分區塊 */}
                  <div className="space-y-2">
                    {/* 用戶名稱 */}
                    <div className="flex items-center gap-2">
                      <span className="text-[#8B7E7E] text-sm">評論者：</span>
                      <h4 className="font-medium text-[#6B5F5F] text-lg">
                        {userDiscussion.user_name}
                      </h4>
                    </div>
                    
                    {/* 評分 */}
                    <div className="flex items-center gap-2">
                      <span className="text-[#8B7E7E] text-sm">評分：</span>
                      <StarRating value={userDiscussion.rating} readOnly />
                      <span className="text-sm text-[#9F9189]">
                        ({userDiscussion.rating} 顆星)
                      </span>
                    </div>
                  </div>

                  {/* 評論內容 */}
                  <div className="space-y-1">
                    <span className="text-[#8B7E7E] text-sm">評論內容：</span>
                    <p className="text-[#8B7E7E] bg-[#FAF9F8] p-3 rounded-lg">
                      {userDiscussion.content}
                    </p>
                  </div>
                </div>

                {/* 編輯刪除按鈕 - 只對自己的評論顯示 */}
                {isOwnDiscussion(userDiscussion) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(userDiscussion)}
                      className="text-[#9F9189] hover:text-[#8B7E7E]"
                      title="編輯評論"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(userDiscussion.id)}
                      className="text-[#C17C7C] hover:text-red-600"
                      title="刪除評論"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 互動按鈕 */}
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={() => handleLike(userDiscussion.id)}
                  className={`flex items-center gap-1 transition-colors duration-300
                    ${likedDiscussions.has(userDiscussion.id) 
                      ? 'text-[#C17C7C]' 
                      : 'text-[#9F9189] hover:text-[#C17C7C]'
                    }`}
                >
                  {likedDiscussions.has(userDiscussion.id) ? (
                    <FaHeart className="w-4 h-4" />
                  ) : (
                    <FaRegHeart className="w-4 h-4" />
                  )}
                  <span>{userDiscussion.likes_count || 0}</span>
                </button>

                <button
                  onClick={() => setReplyingTo(userDiscussion.id)}
                  className="flex items-center gap-1 text-[#9F9189] hover:text-[#8B7E7E]
                           transition-colors duration-300"
                >
                  <FaReply className="w-4 h-4" />
                  <span>回覆 ({userDiscussion.replies?.length || 0})</span>
                </button>

                <button
                  onClick={() => handleShare(userDiscussion)}
                  className="flex items-center gap-1 text-[#9F9189] hover:text-[#8B7E7E]
                           transition-colors duration-300"
                >
                  <FaShare className="w-4 h-4" />
                  <span>分享</span>
                </button>

                {/* 時間戳 */}
                <span className="text-sm text-gray-500 ml-auto">
                  {new Date(userDiscussion.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* 回覆列表 */}
              {userDiscussion.replies && userDiscussion.replies.length > 0 && (
                <div className="mt-4 pl-8 space-y-4">
                  {userDiscussion.replies.map((reply) => (
                    <div 
                      key={reply.id} 
                      className="bg-[#FAF9F8] p-3 rounded-lg border border-[#E8E4DE]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#6B5F5F]">
                            {reply.user_name}
                          </span>
                          <span className="text-sm text-[#9F9189]">回覆</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(reply.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[#8B7E7E]">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 回覆輸入框 */}
              {replyingTo === userDiscussion.id && (
                <div className="mt-4 pl-8 border-l-2 border-[#F0EBE8]">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full px-3 py-2 
                      border border-[#F0EBE8] 
                      rounded-lg 
                      bg-white 
                      placeholder-[#BFB8B8]
                      outline-none
                      focus:border-[#B6AD9A]
                      hover:border-[#D3CDC6]
                      transition-all duration-200
                      resize-none"
                    placeholder="回覆這則評論..."
                    rows="3"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                      className="px-4 py-1.5 text-sm text-[#9F9189] hover:text-[#8B7E7E]"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleReply(userDiscussion.id)}
                      disabled={!replyContent.trim() || isSubmittingReply}
                      className="px-4 py-1.5 text-sm text-white bg-[#9F9189] 
                        hover:bg-[#8B7E7E] rounded-lg disabled:opacity-50
                        flex items-center gap-2"
                    >
                      {isSubmittingReply ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          發布中...
                        </>
                      ) : (
                        '發布回覆'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* 其他評論區塊 */}
        <div className="bg-[#FDFCFB] p-4 rounded-lg border border-[#E8E4DE]">
          <div className="text-sm text-[#9F9189]">
            {otherDiscussions.length > 0 
              ? `其他 ${otherDiscussions.length} 則評論` 
              : '尚無其他評論'}
          </div>
          
          <div className="space-y-4">
            {/* 評論卡片 */}
            <AnimatePresence mode="popLayout">
              {otherDiscussions
                .sort((a, b) => {
                  if (sortBy === 'newest') {
                    return new Date(b.created_at) - new Date(a.created_at);
                  } else if (sortBy === 'highest') {
                    return b.rating - a.rating;
                  } else {
                    return a.rating - b.rating;
                  }
                })
                .slice(0, isExpanded ? undefined : INITIAL_DISPLAY_COUNT)
                .map((discussion) => (
                  <motion.div
                    key={discussion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut"
                    }}
                    layout
                    className="bg-white p-4 rounded-lg border border-[#F0EBE8] relative group"
                  >
                    {/* 評論內容 */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-3"
                    >
                      {/* 用戶名稱區塊 */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 text-sm">評論者：</span>
                        <h3 className="text-lg font-bold text-[#5C4033] mb-0">
                          {discussion.user_name}
                        </h3>
                      </div>

                      {/* 評分區塊 */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 text-sm">評分：</span>
                        <div className="flex items-center">
                          <StarRating
                            value={discussion.rating}
                            readOnly={true}
                          />
                          <span className="ml-2 text-sm text-gray-500">
                            ({discussion.rating} 顆星)
                          </span>
                        </div>
                      </div>

                      {/* 評論內容區塊 */}
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 text-sm">評論內容：</span>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mb-0 mt-2">
                          {discussion.content}
                        </p>
                      </div>
                    </motion.div>

                    {/* 回覆區塊 */}
                    <AnimatePresence>
                      {discussion.replies && discussion.replies.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pl-8 space-y-4"
                        >
                          {discussion.replies.map((reply, index) => (
                            <motion.div
                              key={reply.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-[#FAF9F8] p-3 rounded-lg border border-[#E8E4DE]"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-[#6B5F5F]">
                                    {reply.user_name}
                                  </span>
                                  <span className="text-sm text-[#9F9189]">回覆</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(reply.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[#8B7E7E]">{reply.content}</p>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 回覆輸入框 */}
                    <AnimatePresence>
                      {replyingTo === discussion.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pl-8 border-l-2 border-[#F0EBE8]"
                        >
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full px-3 py-2 border border-[#F0EBE8] rounded-lg"
                            placeholder="回覆這則評論..."
                            rows="3"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                              className="px-4 py-1.5 text-sm text-[#9F9189]"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleReply(discussion.id)}
                              className="px-4 py-1.5 text-sm text-white bg-[#9F9189] rounded-lg"
                            >
                              發布回覆
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 互動按鈕 */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-4 mt-4"
                    >
                      {/* 點讚按鈕 */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleLike(discussion.id)}
                        className={`flex items-center gap-1 transition-colors duration-300
                          ${likedDiscussions.has(discussion.id) 
                            ? 'text-[#C17C7C]' 
                            : 'text-[#9F9189] hover:text-[#C17C7C]'
                          }`}
                      >
                        {likedDiscussions.has(discussion.id) ? (
                          <FaHeart className="w-4 h-4" />
                        ) : (
                          <FaRegHeart className="w-4 h-4" />
                        )}
                        <span>{discussion.likes_count || 0}</span>
                      </motion.button>

                      {/* 回覆按鈕 */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setReplyingTo(discussion.id)}
                        className={`flex items-center gap-1 text-[#9F9189] hover:text-[#8B7E7E]
                                 transition-colors duration-300`}
                      >
                        <FaReply className="w-4 h-4" />
                        <span>回覆 ({discussion.replies?.length || 0})</span>
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 展開/收合按鈕 */}
        {discussions.length > INITIAL_DISPLAY_COUNT && (
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-3 px-4 
              text-[#8B7E7E] text-sm
              border border-[#E8E4DE] rounded-lg
              hover:bg-[#FAF9F8] 
              transition-all duration-200
              flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                收合評論 <FaChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                查看更多評論 ({discussions.length - INITIAL_DISPLAY_COUNT}) 
                <FaChevronDown className="w-3 h-3" />
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}
