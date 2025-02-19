"use client";
// ===== React 相關引入 =====
import { useState, useEffect } from "react"; // 引入 React 狀態管理和生命週期鉤子
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
import {
  showDiscussionAlert, // 引入討論區彈窗提示工具（用於重要操作確認和錯誤提示）
} from "@/utils/sweetalert";

import {
  discussionToast, // 引入評論區輕量提示工具（用於操作成功和一般提示）
  ToastContainerComponent, // 引入 Toast 容器組件（用於管理所有輕量提示）
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

  // 獲取評論列表
  const fetchDiscussions = async () => {
    try {
      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setDiscussions(data.discussions);
      setAverageRating(data.averageRating);
      setTotalCount(data.total);
    } catch (error) {
      // 使用 Toast 顯示一般錯誤提示
      discussionToast.error("無法載入評論，請稍後再試");
      console.error("獲取評論失敗:", error);
    }
  };

  // 提交評論（新增或編輯）
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      // 使用 Toast 顯示表單驗證提示
      discussionToast.error("請輸入評論內容");
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (editingDiscussionId) {
        // 編輯現有評論
        res = await fetch(
          `/api/camping/activities/${activityId}/discussions/${editingDiscussionId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, rating }),
          }
        );
      } else {
        // 新增評論
        res = await fetch(`/api/camping/activities/${activityId}/discussions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, rating }),
        });
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // 使用 Toast 顯示操作成功提示
      discussionToast.success(
        editingDiscussionId ? "評論更新成功" : "評論發布成功"
      );
      setContent("");
      setRating(5);
      setEditingDiscussionId(null);
      fetchDiscussions();
    } catch (error) {
      // 使用 SweetAlert 顯示系統錯誤
      await showDiscussionAlert.error(error.message || "操作失敗，請稍後再試");
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
  const handleLike = (discussionId) => {
    setLikedDiscussions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(discussionId)) {
        newSet.delete(discussionId);
      } else {
        newSet.add(discussionId);
      }
      return newSet;
    });
    discussionToast.success("感謝您的回饋！");
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
      discussionToast.success("連結已複製到剪貼簿！");
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

  // 獲取當前用戶的評論
  const userDiscussion = discussions.find(
    (d) => d.user_id === session?.user?.id
  );

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
      console.log("正在獲取討論回覆:", discussionId); // 添加日誌

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* 評論區標題 */}
      <div className="space-y-4">
        {/* 主標題和排序 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-medium text-[#5D564D]">評論區</h2>
            <div className="text-[#9F9189] text-sm">
              {discussions.length > 0 && (
                <span>平均 {averageRating.toFixed(1)} 顆星 • {discussions.length} 則評論</span>
              )}
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
          userDiscussion ? (
            // 已經評論過的提示
            <div className="bg-[#FDFCFB] p-6 rounded-lg border border-[#E8E4DE]">
              <div className="flex items-center gap-3 text-[#9F9189]">
                <div className="w-10 h-10 rounded-full bg-[#F0EBE8] flex items-center justify-center">
                  <span className="text-lg">✓</span>
                </div>
                <div>
                  <p className="font-medium text-[#5D564D]">您已發表過評論</p>
                  <p className="text-sm">
                    發表於 {new Date(userDiscussion.created_at).toLocaleDateString()}
                    {' • '}
                    <button 
                      onClick={() => {
                        // 滾動到我的評論
                        const myCommentElement = document.getElementById(`discussion-${userDiscussion.id}`);
                        myCommentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="text-[#B6AD9A] hover:text-[#8B7E7E] underline underline-offset-2"
                    >
                      查看我的評論
                    </button>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // 原有的評論輸入區
            <div className="bg-white p-6 rounded-lg border border-[#F0EBE8] space-y-4">
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
                {/* 字數提示 */}
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
                    transition-all duration-200
                    ${content.length === 0 
                      ? 'bg-[#D3CDC6] cursor-not-allowed'
                      : 'bg-[#9F9189] hover:bg-[#8B7E7E] hover:shadow-md'
                    }`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>
                      發布中...
                    </span>
                  ) : (
                    '發布評論'
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
      </div>

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
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-[#6B5F5F]">
                    {userDiscussion.user_name}
                  </h4>
                  <StarRating value={userDiscussion.rating} readOnly />
                </div>
                {userDiscussion.user_id === session?.user?.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(userDiscussion)}
                      className="text-[#9F9189] border border-transparent
                                hover:border-[#9F9189] hover:bg-[#FAF9F8]
                                transition-all duration-300 p-1.5 rounded-full"
                      title="編輯評論"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(userDiscussion.id)}
                      className="text-[#C17C7C] border border-transparent
                                hover:border-[#C17C7C] hover:bg-[#FDF9F9]
                                transition-all duration-300 p-1.5 rounded-full"
                      title="刪除評論"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[#8B7E7E] mb-3">{userDiscussion.content}</p>

              {/* 回覆列表 */}
              <AnimatePresence>
                {replies[userDiscussion.id]?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pl-4 border-l-2 border-[#F0EBE8] space-y-3"
                  >
                    {replies[userDiscussion.id].map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-[#FAF9F8] rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-[#6B5F5F]">
                            {reply.user_name}
                          </div>
                          <time className="text-xs text-[#9F9189]">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </time>
                        </div>
                        <p className="text-sm text-[#8B7E7E] mt-1">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 互動按鈕 */}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <button
                  onClick={() => handleLike(userDiscussion.id)}
                  className="flex items-center gap-1 text-[#9F9189] hover:text-[#C17C7C]
                           transition-colors duration-300"
                >
                  {likedDiscussions.has(userDiscussion.id) ? (
                    <FaHeart className="w-4 h-4" />
                  ) : (
                    <FaRegHeart className="w-4 h-4" />
                  )}
                  <span>讚好</span>
                </button>

                <button
                  onClick={() => setReplyingTo(userDiscussion.id)}
                  className="flex items-center gap-1 text-[#9F9189] hover:text-[#8B7E7E]
                           transition-colors duration-300"
                >
                  <FaReply className="w-4 h-4" />
                  <span>回覆</span>
                </button>

                <button
                  onClick={() => handleShare(userDiscussion)}
                  className="flex items-center gap-1 text-[#9F9189] hover:text-[#8B7E7E]
                           transition-colors duration-300"
                >
                  <FaShare className="w-4 h-4" />
                  <span>分享</span>
                </button>

                <time className="text-[#9F9189] ml-auto">
                  {new Date(userDiscussion.created_at).toLocaleDateString()}
                </time>
              </div>

              {/* 回覆表單 */}
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
          <div className="text-sm text-[#9F9189] mb-3">
            {discussions.length > 1 ? `其他 ${discussions.length - 1} 則評論` : '尚無其他評論'}
          </div>
          
          <div className="space-y-4">
            {/* 評論卡片 */}
            <AnimatePresence>
              {getSortedDiscussions(discussions, sortBy)
                .filter(d => d.id !== userDiscussion?.id)
                .slice(0, isExpanded ? discussions.length : INITIAL_DISPLAY_COUNT)
                .map(discussion => (
                  <motion.div 
                    key={discussion.id}
                    className="bg-white p-4 rounded-lg border border-[#F0EBE8] relative group"
                  >
                    {/* 編輯模式提示 */}
                    {editingDiscussionId === discussion.id && (
                      <div className="absolute -top-3 left-4 bg-[#8B7E7E] text-white text-xs px-2 py-1 rounded-full">
                        編輯模式
                      </div>
                    )}

                    {/* 編輯提示框 */}
                    {editingDiscussionId === discussion.id && (
                      <div className="bg-[#FAF9F8] p-3 rounded-lg mb-3 text-sm text-[#9F9189]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[#B6AD9A]">編輯小提示</span>
                          <span>✍️</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                          <li>您可以修改評分和評論內容</li>
                          <li>字數限制為 500 字</li>
                          <li>請遵守社群規範</li>
                        </ul>
                      </div>
                    )}

                    {/* 原有的評論內容 */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-[#6B5F5F]">
                          {discussion.user_name}
                        </h4>
                        <StarRating value={discussion.rating} readOnly />
                      </div>
                      {discussion.user_id === session?.user?.id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(discussion)}
                            className="text-[#9F9189] border border-transparent
                                      hover:border-[#9F9189] hover:bg-[#FAF9F8]
                                      transition-all duration-300 p-1.5 rounded-full"
                            title="編輯評論"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(discussion.id)}
                            className="text-[#C17C7C] border border-transparent
                                      hover:border-[#C17C7C] hover:bg-[#FDF9F9]
                                      transition-all duration-300 p-1.5 rounded-full"
                            title="刪除評論"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 評論內容 */}
                    <p className="text-[#5D564D] mb-3">{discussion.content}</p>

                    {/* 互動按鈕組 */}
                    <div className="flex items-center gap-4 text-sm">
                      {/* 點讚按鈕 */}
                      <button 
                        onClick={() => handleLike(discussion.id)}
                        className="flex items-center gap-1 text-[#9F9189] hover:text-[#8B7E7E]"
                      >
                        <FaHeart className="w-4 h-4" />
                        <span>{discussion.likes || 0}</span>
                      </button>

                      {/* 回覆按鈕 */}
                      <button 
                        onClick={() => setReplyingTo(discussion.id)}
                        className="flex items-center gap-1 text-[#9F9189] hover:text-[#8B7E7E]"
                      >
                        <FaReply className="w-4 h-4" />
                        <span>回覆</span>
                      </button>

                      {/* 分享按鈕 */}
                      <button 
                        onClick={() => handleShare(discussion)}
                        className="flex items-center gap-1 text-[#9F9189] hover:text-[#8B7E7E]"
                      >
                        <FaShare className="w-4 h-4" />
                        <span>分享</span>
                      </button>

                      <time className="text-[#9F9189] ml-auto">
                        {new Date(discussion.created_at).toLocaleDateString()}
                      </time>
                    </div>

                    {/* 回覆輸入框 */}
                    {replyingTo === discussion.id && (
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
                            onClick={() => handleReply(discussion.id)}
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

                    {/* 回覆列表 */}
                    {discussion.replies?.length > 0 && (
                      <div className="mt-4 pl-8 space-y-4 border-l-2 border-[#F0EBE8]">
                        {discussion.replies.map((reply) => (
                          <motion.div 
                            key={reply.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#FDFCFB] p-3 rounded-lg"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#5D564D]">{reply.user_name}</span>
                                {reply.is_author && (
                                  <span className="text-xs px-1.5 py-0.5 bg-[#F0EBE8] text-[#9F9189] rounded">作者</span>
                                )}
                              </div>
                              <time className="text-sm text-[#9F9189]">
                                {new Date(reply.created_at).toLocaleDateString()}
                              </time>
                            </div>
                            <p className="text-[#5D564D]">{reply.content}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
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

      <ToastContainerComponent />
    </div>
  );
}
