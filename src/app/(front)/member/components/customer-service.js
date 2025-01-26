'use client';

import React, { useState } from 'react';
import SearchBar from './search-bar';
import MessageBubble from './message-bubble';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/customer-service.scss';

const messages = [
  {
    id: 1,
    user: {
      title: '南投埔里 LOLO農場-休閒露營園區這到底有沒有把關過退費',
      avatar: '/images/member/avatar1.png',
      nickname: '用戶暱稱1',
      content:
        '因為連日地震和大雨，我很感謝營主可以讓我們延期，只是到了現場後，營主的電話完全打不通（大概打了10通有），營本部也沒人，溜滑梯區雜草叢生完全沒整理，也沒辦法下去玩，洗澡水溫很難調整，不是超燙就是超冷，冰箱也不夠冷，對了，說明中的咖啡廳早就沒營業了。 雨棚區完全沒有景觀，我只能說這間是絕對不會再訪的營區，若營主尚有心做露營，請好好整理經營，謝謝',
    },
    official: [
      {
        avatar: '/images/member/avatar2.png',
        nickname: '官方暱稱2',
        fullContent:
          '我們會加強對營地的管理，確保未來不會再發生類似情況，感謝您的反饋。',
      },
    ],
  },
  {
    id: 2,
    user: {
      title: '台中市區露營地點推薦',
      avatar: '/images/member/avatar3.png',
      nickname: '用戶暱稱2',
      content:
        '請問台中市區有沒有推薦的露營地點？希望交通方便，設施完善，適合家庭出遊。',
    },
    official: [
      {
        avatar: '/images/member/avatar4.png',
        nickname: '官方暱稱3',
        fullContent:
          '推薦您可以考慮台中市的XX露營區，該露營區交通便利，設施完善，非常適合家庭出遊。',
      },
    ],
  },
  // ...其他對話資料
];

export default function CustomerService() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const toggleExpand = (id) => {
    setExpandedMessageId(expandedMessageId === id ? null : id);
  };

  const handleReplyChange = (e) => {
    setReplyContent(e.target.value);
  };

  const handleReplySubmit = (id) => {
    // 在這裡處理回覆邏輯，例如將回覆內容添加到對應的消息中
    console.log(`Reply to message ${id}: ${replyContent}`);
    setReplyContent('');
  };

  const handleKeyPress = (e, id) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReplySubmit(id);
    }
  };

  const filteredMessages = messages.filter(
    (message) =>
      message.user.nickname.includes(searchTerm) ||
      message.user.content.includes(searchTerm) ||
      message.official.some(
        (official) =>
          official.nickname.includes(searchTerm) ||
          official.fullContent.includes(searchTerm)
      )
  );

  return (
    <div className="customer-service">
      <h1>客服問答區</h1>
      <SearchBar placeholder="搜尋問答..." onSearch={handleSearch} />
      {filteredMessages.map((message) => (
        <div
          key={message.id}
          className={`message-card ${
            expandedMessageId === message.id ? 'expanded' : ''
          }`}
        >
          <div className="message-title">{message.user.title}</div>
          <MessageBubble
            type="user"
            avatar={message.user.avatar}
            nickname={message.user.nickname}
            content={message.user.content}
          />
          {expandedMessageId === message.id &&
            message.official.map((official, index) => (
              <MessageBubble
                key={index}
                type="official"
                avatar={official.avatar}
                nickname={official.nickname}
                content={official.fullContent}
              />
            ))}
          {expandedMessageId === message.id && (
            <div className="reply-section">
              <textarea
                value={replyContent}
                onChange={handleReplyChange}
                onKeyPress={(e) => handleKeyPress(e, message.id)}
                placeholder="輸入您的回覆..."
              />
              <button onClick={() => handleReplySubmit(message.id)}>
                回覆
              </button>
            </div>
          )}
          <div className="message-footer">
            <button onClick={() => toggleExpand(message.id)}>
              {expandedMessageId === message.id ? '縮小回復' : '查看回覆'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
