'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash } from 'react-icons/fa';
import StarRating from './StarRating';
import DiscussionCarousel from './DiscussionCarousel';

export default function DiscussionSection({ activityId }) {
  const { data: session, status } = useSession();
  const [discussions, setDiscussions] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDiscussionId, setEditingDiscussionId] = useState(null);

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
      toast.error('獲取評論失敗');
      console.error('Error fetching discussions:', error);
    }
  };

  // 提交評論
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('請輸入評論內容');
      return;
    }

    setIsLoading(true);
    try {
      let res;
      // 判斷是新增還是編輯
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
      
      toast.success(editingDiscussionId ? '評論更新成功' : '評論發布成功');
      setContent('');
      setRating(5);
      setEditingDiscussionId(null);
      fetchDiscussions();
    } catch (error) {
      toast.error(error.message);
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
    if (!confirm('確定要刪除這則評論嗎？')) return;

    try {
      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions/${discussionId}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('評論已刪除');
      fetchDiscussions();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 初始加載評論
  useEffect(() => {
    fetchDiscussions();
  }, [activityId]);

  // 獲取當前用戶的評論
  const userDiscussion = discussions.find(d => d.user_id === session?.user?.id);

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      {/* 評論區標題和平均評分 */}
      <div className="bg-[var(--lightest-brown)] rounded-lg shadow p-6 mb-8 border border-[var(--tertiary-brown)]">
        <h2 className="text-2xl font-bold mb-4 text-[var(--primary)]">評論區</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl font-bold text-[var(--primary)]">
            {averageRating?.toFixed(1) || '0.0'}
          </div>
          <div>
            <StarRating value={averageRating} readOnly />
            <div className="text-sm text-[var(--secondary-brown)] mt-1">
              {totalCount} 則評價
            </div>
          </div>
        </div>

        {/* 評論表單或當前用戶的評論 */}
        {userDiscussion && !editingDiscussionId ? (
          <div className="border border-[var(--tertiary-brown)] rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-[var(--primary)]">我的評論</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(userDiscussion)}
                  className="text-[var(--secondary-2)] border border-transparent
                    hover:border-[var(--secondary-2)] hover:bg-white
                    transition-all duration-300 p-1.5 rounded-full"
                  title="編輯評論"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(userDiscussion.id)}
                  className="text-[var(--status-error)] border border-transparent
                    hover:border-[var(--status-error)] hover:bg-white
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
            <p className="text-[var(--gray-2)]">{userDiscussion.content}</p>
            <time className="text-sm text-[var(--secondary-brown)] mt-2 block">
              {new Date(userDiscussion.created_at).toLocaleDateString()}
            </time>
          </div>
        ) : status === 'authenticated' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[var(--gray-2)] mb-2">評分</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div className="relative pb-14">
              <label className="block text-[var(--gray-2)] mb-2">
                {editingDiscussionId ? '編輯評論' : '評論內容'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--tertiary-brown)] rounded-lg 
                  focus:ring-2 focus:ring-[var(--secondary-2)] focus:border-[var(--secondary-2)] 
                  bg-white placeholder-[var(--gray-4)]"
                rows="4"
                placeholder="分享您的體驗..."
              />
              <div className="absolute bottom-0 right-0 flex gap-2">
                {editingDiscussionId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-2 px-4 border-2 border-[var(--gray-4)] bg-white text-[var(--gray-4)] 
                      rounded-lg hover:bg-[var(--gray-4)] hover:text-white transition-all duration-300 
                      text-sm font-medium"
                  >
                    取消
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2 px-6 border-2 border-[var(--secondary-2)] 
                    bg-[var(--secondary-2)] text-white rounded-lg 
                    hover:bg-white hover:text-[var(--secondary-2)] 
                    transition-all duration-300 disabled:opacity-50 
                    disabled:cursor-not-allowed disabled:hover:bg-[var(--secondary-2)] 
                    disabled:hover:text-white text-sm font-medium"
                >
                  {isLoading ? '處理中...' : (editingDiscussionId ? '更新評論' : '發布評論')}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 bg-white rounded-lg border border-[var(--tertiary-brown)]">
            <p className="text-[var(--gray-2)]">請先登入後才能發表評論</p>
          </div>
        )}
      </div>

      {/* 其他評論輪播 */}
      {discussions.length > 1 && (
        <DiscussionCarousel 
          discussions={discussions.filter(d => d.user_id !== session?.user?.id)} 
        />
      )}
    </div>
  );
} 