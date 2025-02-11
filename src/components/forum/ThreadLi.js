import React from 'react'
import DOMPurify from 'dompurify'
import { clippingParents } from '@popperjs/core';

const ThreadLi = ({ item }) => {
  if (!item) return null; // 防止錯誤

  const {
    pinned,
    featured,
    created_at,
    updated_at,
    user_name,
    thread_title,
    thread_content,
    user_avatar,
    floor,
  } = item;

  // 解析時間
  const threadDate = new Date(updated_at).toLocaleDateString();
  const threadTime = new Date(updated_at).toLocaleTimeString();

  // 使用 DOMPurify 清理內容
  const sanitizedContent = DOMPurify.sanitize(thread_content);

  return (
    <div className={`threadLi ${floor === 1 ? 'owner' : 'reply'}`}>
      {floor === 1 ? (
        <>
          <div className="threadPageHeader d-flex justify-content-between">
            <div className="threadLandlord d-flex align-items-center">
              <div className="floor">樓主</div>
              <div className="landlordImg me-4">
                <img className="avatarAdaptive" src={'/images/member/'+user_avatar} alt={user_name} />
              </div>
              <p className="userName fs-6 m-0">{user_name}</p>
              {pinned === 1 && <div className="pinned ms-3"><i className="fa-solid fa-arrow-up"></i> 置頂</div>}
              {featured === 1 && <div className="featured ms-3"><i className="fa-solid fa-star"></i> 精華</div>}
            </div>
            <div className="dateTimeEdit">
              <span>{threadDate}</span>
              <span>{threadTime}</span>
              <span>{created_at === updated_at ? '發文' : '編輯'}</span>
            </div>
          </div>
          <div className="threadPageContent">
            <div className="threadPageTitle">{thread_title}</div>
            <div className="threadPageText ql-editor" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
          </div>
        </>
      ) : (
        /* 回覆的區塊 */
        <>
          <div className="threadPageHeader d-flex justify-content-between">
            <div className="threadLandlord d-flex align-items-center">
              <div className="floor">{floor} 樓</div>
              <div className="landlordImg me-4">
                <img
                  className="avatarAdaptive"
                  src={'/images/member/'+user_avatar}
                  alt={user_name}
                />
              </div>
              <p className="userName fs-6 m-0">{user_name}</p>
            </div>
            <div className="dateTimeEdit">
              <span>{threadDate}</span>
              <span>{threadTime}</span>
              <span>{created_at === updated_at ? '發文' : '編輯'}</span>
            </div>
          </div>
          <div
            className="threadPageText ql-editor"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
          {/* {console.log(sanitizedContent)} */}
        </>
      )}
    </div>
  );
};

export default ThreadLi;
