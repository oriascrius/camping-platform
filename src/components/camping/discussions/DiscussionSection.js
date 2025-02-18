'use client';
// ===== React 相關引入 =====
import { useState, useEffect } from 'react';                // 引入 React 狀態管理和生命週期鉤子
import { useSession } from 'next-auth/react';              // 引入使用者身份驗證功能

// ===== UI 組件和圖標引入 =====
import { FaEdit, FaTrash, FaHeart, FaRegHeart, FaReply, FaShare, FaChevronDown, FaChevronUp } from 'react-icons/fa';          // 引入編輯和刪除圖標組件

// ===== 自定義組件引入 =====
import StarRating from './StarRating';                     // 引入星級評分組件
import DiscussionCarousel from './DiscussionCarousel';     // 引入評論輪播展示組件

// ===== 自定義提示工具引入 =====
import { 
  showDiscussionAlert,      // 引入討論區彈窗提示工具（用於重要操作確認和錯誤提示）
} from "@/utils/sweetalert";

import {
  discussionToast,          // 引入討論區輕量提示工具（用於操作成功和一般提示）
  ToastContainerComponent   // 引入 Toast 容器組件（用於管理所有輕量提示）
} from "@/utils/toast";

import { motion, AnimatePresence } from 'framer-motion'; // 需要安裝 framer-motion

export default function DiscussionSection({ activityId }) {
  const { data: session, status } = useSession();
  const [discussions, setDiscussions] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDiscussionId, setEditingDiscussionId] = useState(null);
  const [likedDiscussions, setLikedDiscussions] = useState(new Set());
  const [showReplyForm, setShowReplyForm] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'highest', 'lowest'
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_DISPLAY_COUNT = 3; // 預設顯示的評論數量
  const [replies, setReplies] = useState({});  // 儲存所有評論的回覆
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // 獲取評論列表
  const fetchDiscussions = async () => {
    try {
      const res = await fetch(`/api/camping/activities/${activityId}/discussions`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setDiscussions(data.discussions);
      setAverageRating(data.averageRating);
      setTotalCount(data.total);
    } catch (error) {
      // 使用 Toast 顯示一般錯誤提示
      discussionToast.error('無法載入評論，請稍後再試');
      console.error('獲取評論失敗:', error);
    }
  };

  // 提交評論（新增或編輯）
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      // 使用 Toast 顯示表單驗證提示
      discussionToast.error('請輸入評論內容');
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
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, rating }),
          }
        );
      } else {
        // 新增評論
        res = await fetch(`/api/camping/activities/${activityId}/discussions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, rating }),
        });
      }

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      // 使用 Toast 顯示操作成功提示
      discussionToast.success(editingDiscussionId ? '評論更新成功' : '評論發布成功');
      setContent('');
      setRating(5);
      setEditingDiscussionId(null);
      fetchDiscussions();
    } catch (error) {
      // 使用 SweetAlert 顯示系統錯誤
      await showDiscussionAlert.error(error.message || '操作失敗，請稍後再試');
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
    setContent('');
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
        { method: 'DELETE' }
      );

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      // 使用 Toast 顯示刪除成功提示
      discussionToast.success('評論已成功刪除');
      fetchDiscussions();
    } catch (error) {
      // 使用 SweetAlert 顯示系統錯誤
      await showDiscussionAlert.error(error.message || '刪除失敗，請稍後再試');
    }
  };

  // 處理點讚
  const handleLike = (discussionId) => {
    setLikedDiscussions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(discussionId)) {
        newSet.delete(discussionId);
      } else {
        newSet.add(discussionId);
      }
      return newSet;
    });
    discussionToast.success('感謝您的回饋！');
  };

  // 處理分享
  const handleShare = async (discussion) => {
    try {
      await navigator.share({
        title: '營地評論分享',
        text: `${discussion.content} - ${discussion.user_name}的評論`,
        url: window.location.href,
      });
    } catch (error) {
      // 如果瀏覽器不支援分享API，則複製連結
      navigator.clipboard.writeText(window.location.href);
      discussionToast.success('連結已複製到剪貼簿！');
    }
  };

  // 排序評論
  const sortDiscussions = (discussions) => {
    switch (sortBy) {
      case 'highest':
        return [...discussions].sort((a, b) => b.rating - a.rating);  // 按評分從高到低排序
      case 'lowest':
        return [...discussions].sort((a, b) => a.rating - b.rating);  // 按評分從低到高排序
      case 'newest':
      default:
        return [...discussions].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)  // 按時間從新到舊排序
        );
    }
  };

  // 初始加載評論
  useEffect(() => {
    fetchDiscussions();
  }, [activityId]);

  // 獲取當前用戶的評論
  const userDiscussion = discussions.find(d => d.user_id === session?.user?.id);

  // 根據展開狀態決定顯示的評論
  const getDisplayedDiscussions = () => {
    const sortedDiscussions = sortDiscussions(discussions);
    return isExpanded ? sortedDiscussions : sortedDiscussions.slice(0, INITIAL_DISPLAY_COUNT);
  };

  // 獲取特定討論的回覆列表
  const fetchReplies = async (discussionId) => {
    try {
      console.log('正在獲取討論回覆:', discussionId); // 添加日誌
      
      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions/${discussionId}/replies`
      );
      const data = await res.json();
      
      if (!res.ok) {
        console.error('API 錯誤:', data.error, data.details); // 添加詳細錯誤信息
        throw new Error(data.error);
      }
      
      setReplies(prev => ({
        ...prev,
        [discussionId]: data.replies
      }));
    } catch (error) {
      console.error('獲取回覆失敗:', error);
      discussionToast.error('無法載入回覆，請稍後再試');
    }
  };

  // 新增提交回覆的函數
  const handleSubmitReply = async (discussionId) => {
    if (!replyContent.trim()) {
      discussionToast.error('請輸入回覆內容');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions/${discussionId}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: replyContent }),
        }
      );

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      discussionToast.success('回覆發布成功');
      setReplyContent('');
      setShowReplyForm(null);
      // 重新獲取該評論的回覆
      fetchReplies(discussionId);
    } catch (error) {
      await showDiscussionAlert.error(error.message || '回覆發布失敗，請稍後再試');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // 修改編輯回覆的函數，加入 discussionId 參數
  const handleEditReply = async (discussionId, replyId, content) => {
    try {
      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions/${discussionId}/replies/${replyId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      discussionToast.success('回覆更新成功');
      // 重新獲取該評論的回覆
      fetchReplies(discussionId);
    } catch (error) {
      await showDiscussionAlert.error(error.message || '更新回覆失敗，請稍後再試');
    }
  };

  // 修改刪除回覆的函數，加入 discussionId 參數
  const handleDeleteReply = async (discussionId, replyId) => {
    const result = await showDiscussionAlert.confirmDelete();
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions/${discussionId}/replies/${replyId}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      discussionToast.success('回覆已成功刪除');
      // 重新獲取該評論的回覆
      fetchReplies(discussionId);
    } catch (error) {
      await showDiscussionAlert.error(error.message || '刪除回覆失敗，請稍後再試');
    }
  };

  // 在 useEffect 中加載回覆
  useEffect(() => {
    if (discussions.length > 0) {
      discussions.forEach(discussion => {
        fetchReplies(discussion.id);
      });
    }
  }, [discussions]);

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      {/* 評論區標題和平均評分 - 調整為更亮的背景色 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FAF9F8] rounded-lg shadow p-6 mb-8 border border-[#F0EBE8]"
      >
        <h2 className="text-2xl font-bold mb-4 text-[#6B5F5F]">評論區</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl font-bold text-[#8B7E7E]">
            {averageRating?.toFixed(1) || '0.0'}
          </div>
          <div>
            <StarRating value={averageRating} readOnly />
            <div className="text-sm text-[#9F9189] mt-1">
              {totalCount} 則評價
            </div>
          </div>
        </div>

        {/* 新增排序選項 */}
        <div className="flex justify-end mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-[#F0EBE8] rounded-lg text-sm text-[#8B7E7E]
                     focus:ring-2 focus:ring-[#9F9189] focus:border-[#9F9189]"
          >
            <option value="newest">最新評論</option>
            <option value="highest">最高評分</option>
            <option value="lowest">最低評分</option>
          </select>
        </div>

        {/* 評論表單或當前用戶的評論 */}
        {userDiscussion && !editingDiscussionId ? (
          <div className="border border-[#F0EBE8] rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-[#6B5F5F]">我的評論</h4>
              <div className="flex gap-3">
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
            </div>
            <div className="mb-2">
              <StarRating value={userDiscussion.rating} readOnly />
            </div>
            <p className="text-[#8B7E7E]">{userDiscussion.content}</p>
            <time className="text-sm text-[#9F9189] mt-2 block">
              {new Date(userDiscussion.created_at).toLocaleDateString()}
            </time>
          </div>
        ) : status === 'authenticated' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#8B7E7E] mb-2">評分</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div className="relative pb-14">
              <label className="block text-[#8B7E7E] mb-2">
                {editingDiscussionId ? '編輯評論' : '評論內容'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-[#F0EBE8] rounded-lg 
                  focus:ring-2 focus:ring-[#9F9189] focus:border-[#9F9189] 
                  bg-white placeholder-[#BFB8B8]"
                rows="4"
                placeholder="分享您的體驗..."
              />
              <div className="absolute bottom-0 right-0 flex gap-2">
                {editingDiscussionId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-2 px-4 border-2 border-[#BFB8B8] bg-white text-[#8B7E7E] 
                      rounded-lg hover:bg-[#FAF9F8] hover:border-[#9F9189] 
                      transition-all duration-300 text-sm font-medium"
                  >
                    取消
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2 px-6 border-2 border-[#9F9189] 
                    bg-[#9F9189] text-white rounded-lg 
                    hover:bg-[#8B7E7E] hover:border-[#8B7E7E] 
                    transition-all duration-300 disabled:opacity-50 
                    disabled:cursor-not-allowed disabled:hover:bg-[#9F9189] 
                    disabled:hover:border-[#9F9189] text-sm font-medium"
                >
                  {isLoading ? '處理中...' : (editingDiscussionId ? '更新評論' : '發布評論')}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 bg-white rounded-lg border border-[#F0EBE8]">
            <p className="text-[#8B7E7E]">請先登入後才能發表評論</p>
          </div>
        )}
      </motion.div>

      {/* 其他評論輪播 */}
      {discussions.length > 1 && (
        <DiscussionCarousel 
          discussions={discussions.filter(d => d.user_id !== session?.user?.id)} 
        />
      )}

      {/* 評論列表區域 */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {getDisplayedDiscussions().map((discussion) => (
            <motion.div
              key={discussion.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border border-[#F0EBE8] rounded-lg p-4 bg-white
                       hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-[#6B5F5F]">{discussion.user_name}</h4>
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
              
              <p className="text-[#8B7E7E] mb-3">{discussion.content}</p>
              
              {/* 回覆列表 */}
              <AnimatePresence>
                {replies[discussion.id]?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pl-4 border-l-2 border-[#F0EBE8] space-y-3"
                  >
                    {replies[discussion.id].map((reply) => (
                      <div key={reply.id} className="bg-[#FAF9F8] rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-[#6B5F5F]">{reply.user_name}</div>
                          <time className="text-xs text-[#9F9189]">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </time>
                        </div>
                        <p className="text-sm text-[#8B7E7E] mt-1">{reply.content}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 互動按鈕 */}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <button
                  onClick={() => handleLike(discussion.id)}
                  className="flex items-center gap-1 text-[#9F9189] hover:text-[#C17C7C]
                           transition-colors duration-300"
                >
                  {likedDiscussions.has(discussion.id) ? 
                    <FaHeart className="w-4 h-4" /> : 
                    <FaRegHeart className="w-4 h-4" />
                  }
                  <span>讚好</span>
                </button>
                
                <button
                  onClick={() => setShowReplyForm(discussion.id)}
                  className="flex items-center gap-1 text-[#9F9189] hover:text-[#8B7E7E]
                           transition-colors duration-300"
                >
                  <FaReply className="w-4 h-4" />
                  <span>回覆</span>
                </button>
                
                <button
                  onClick={() => handleShare(discussion)}
                  className="flex items-center gap-1 text-[#9F9189] hover:text-[#8B7E7E]
                           transition-colors duration-300"
                >
                  <FaShare className="w-4 h-4" />
                  <span>分享</span>
                </button>
                
                <time className="text-[#9F9189] ml-auto">
                  {new Date(discussion.created_at).toLocaleDateString()}
                </time>
              </div>

              {/* 回覆表單 */}
              <AnimatePresence>
                {showReplyForm === discussion.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-[#F0EBE8]"
                  >
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="寫下您的回覆..."
                      className="w-full px-3 py-2 border border-[#F0EBE8] rounded-lg
                               focus:ring-2 focus:ring-[#9F9189] focus:border-[#9F9189]
                               text-sm resize-none"
                      rows="2"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          setShowReplyForm(null);
                          setReplyContent('');
                        }}
                        className="px-3 py-1 text-sm text-[#8B7E7E] hover:bg-[#FAF9F8]
                                 rounded-lg transition-colors duration-300"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSubmitReply(discussion.id)}
                        disabled={isSubmittingReply}
                        className="px-3 py-1 text-sm text-white bg-[#9F9189]
                                 hover:bg-[#8B7E7E] rounded-lg transition-colors duration-300
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingReply ? '發布中...' : '回覆'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 展開/收合按鈕 */}
        {discussions.length > INITIAL_DISPLAY_COUNT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-4"
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="group flex items-center gap-2 px-4 py-2 rounded-full
                       border border-[#F0EBE8] bg-white text-[#8B7E7E]
                       hover:bg-[#FAF9F8] transition-all duration-300"
            >
              <span className="text-sm font-medium">
                {isExpanded ? '收合評論' : `查看更多 (${discussions.length - INITIAL_DISPLAY_COUNT})`}
              </span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-[#9F9189] group-hover:text-[#8B7E7E]"
              >
                <FaChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
          </motion.div>
        )}

        {/* 沒有評論時的提示 */}
        {discussions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 bg-white rounded-lg border border-[#F0EBE8]"
          >
            <p className="text-[#8B7E7E]">目前還沒有評論，來寫下第一則評論吧！</p>
          </motion.div>
        )}
      </div>

      {/* 評論統計資訊 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-center text-sm text-[#9F9189]"
      >
        共 {discussions.length} 則評論
        {discussions.length > 0 && ` • 平均 ${averageRating.toFixed(1)} 顆星`}
      </motion.div>

      <ToastContainerComponent />
    </div>
  );
} 