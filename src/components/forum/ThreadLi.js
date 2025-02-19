import React from 'react'
import { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { clippingParents } from '@popperjs/core';
import { useSession } from "next-auth/react";
import EditExpressModal from './EditExpressModal';

const ThreadLi = ({ item, threadId, setData, expressDataReturn }) => {
  const { data: session, status } = useSession();

  if (!item) return null; // 防止錯誤
 
  /*
  const [ReturnExpressData, setReturnExpressData] = useState({
    id: '',
    category_id: '0',
    type_id: '0',
    thread_image: '#',
    thread_title: '',
    thread_content: '',
    status: '',
  })
  useEffect(() => {
    if (expressDataReturn) {
      setReturnExpressData({
          id: expressDataReturn.id || '',
          category_id: expressDataReturn.category_id || '0',
          type_id: expressDataReturn.type_id || '0',
          thread_image: expressDataReturn.thread_image || '',
          thread_title: expressDataReturn.thread_title || '',
          thread_content: expressDataReturn.thread_content || '',
          status: expressDataReturn.status || '',
      })
    }
  }, [expressDataReturn]) // 只有當 data 變更時才更新 modalData
  // console.log('更新回來的資訊 = '+ReturnData.thread_title);
  // console.log(expressDataReturn);
  */
  // console.log(item)
  
  const {
    category_id,
    type_id,
    thread_image,
    pinned,
    featured,
    created_at,
    updated_at,
    user_name,
    thread_title,
    thread_content,
    user_avatar,
    user_id,
    floor,
  } = item;

  // console.log('目前登入者 id = '+ session.user.id);
  // console.log('這篇文章的作者 id = '+ user_id);

  // 解析時間
  const threadDate = new Date(updated_at).toLocaleDateString();
  const threadTime = new Date(updated_at).toLocaleTimeString();

  // 文章類型製作
  const category_name = {
    1: '好物分享',
    2: '營地見聞',
    3: '活動揪團',
    4: '露營知識',
    5: '露友閒聊',
  }

  // 標題文字製作
  const title_type_name = {
    1: '心得',
    2: '問題',
    3: '討論',
    4: '情報',
    5: '閒聊',
  }

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
              { session.user.id == user_id && <span data-bs-toggle="modal" data-bs-target="#editExpressModal" onClick={() => setData(item)}>修改</span>}
              
            </div>
          </div>
          <div className="threadPageContent">
            <div className="threadPageTitle">{category_name[category_id]}【{title_type_name[type_id]}】 {thread_title}</div>
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
              { session.user.id == user_id && <span data-bs-toggle="modal" data-bs-target="#replyModal">修改</span>}
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
