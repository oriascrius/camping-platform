'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
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
      const res = await fetch(`/api/camping/activities/${activityId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, rating }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('評論發布成功');
      setContent('');
      setRating(5);
      fetchDiscussions();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 編輯評論
  const handleEdit = async (discussion) => {
    setContent(discussion.content);
    setRating(discussion.rating);
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
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">評論區</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl font-bold">
            {averageRating?.toFixed(1) || '0.0'}
          </div>
          <div>
            <StarRating value={averageRating} readOnly />
            <div className="text-sm text-gray-500 mt-1">
              {totalCount} 則評價
            </div>
          </div>
        </div>

        {/* 評論表單或當前用戶的評論 */}
        {userDiscussion ? (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">我的評論</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(userDiscussion)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  編輯
                </button>
                <button
                  onClick={() => handleDelete(userDiscussion.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  刪除
                </button>
              </div>
            </div>
            <div className="mb-2">
              <StarRating value={userDiscussion.rating} readOnly />
            </div>
            <p className="text-gray-700">{userDiscussion.content}</p>
            <time className="text-sm text-gray-500 mt-2 block">
              {new Date(userDiscussion.created_at).toLocaleDateString()}
            </time>
          </div>
        ) : status === 'authenticated' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">評分</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">評論內容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="分享您的體驗..."
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              發布評論
            </button>
          </form>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">請先登入後才能發表評論</p>
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