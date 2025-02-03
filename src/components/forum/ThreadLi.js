import React from 'react'
import DOMPurify from 'dompurify'

const ThreadLi = ({ item }) => {
  const {
    pinned,
    featured,
    threadDate,
    threadTime,
    threadUserName,
    threadTitle,
    threadContent,
    avatarAdaptive,
    floor,
  } = item

  // 使用 DOMPurify 清理 threadContent
  const sanitizedContent = DOMPurify.sanitize(threadContent)

  return (
    <div className={`threadLi ${floor === 1 ? 'owner' : 'reply'}`}>
      {/* 樓主的帖子區塊 */}
      {floor === 1 ? (
        <>
          <div className="threadPageHeader d-flex justify-content-between">
            <div className="threadLandlord d-flex align-items-center">
              <div className="floor">樓主</div>
              <div className="landlordImg me-4">
                <img
                  className="avatarAdaptive"
                  src={avatarAdaptive}
                  alt={threadUserName}
                />
              </div>
              <p className="userName fs-6 m-0">艾莉絲</p>
              <div className="typeBox ms-5">
                <i className="fa-solid fa-tag icon"></i>露營知識
              </div>
              {pinned === 1 && (
                <div className="pinned ms-3">
                  <i className="fa-solid fa-arrow-up"></i> 置頂
                </div>
              )}
              {featured === 1 && (
                <div className="featured ms-3">
                  <i className="fa-solid fa-star"></i> 精華
                </div>
              )}
            </div>
            <div className="dateTimeEdit">
              <span>{threadDate}</span>
              <span>{threadTime}</span>
              <span>發文</span>
              <span>
                |　<a href="">編輯</a>
              </span>
            </div>
          </div>
          <div className="threadPageContent">
            <div className="threadPageTitle">{threadTitle}</div>
            <div
              className="threadPageText ql-editor"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </div>
        </>
      ) : (
        /* 回覆的區塊 */
        <>
          <div class="threadPageHeader d-flex justify-content-between">
            <div class="threadLandlord d-flex align-items-center">
              <div class="floor">{floor} 樓</div>
              <div class="landlordImg me-4">
                <img
                  class="avatarAdaptive"
                  src={avatarAdaptive}
                  alt={threadUserName}
                />
              </div>
              <p class="userName fs-6 m-0">{threadUserName}</p>
            </div>
            <div class="dateTimeEdit">
              <span>{threadDate}</span>
              <span>{threadTime}</span>
              <span>發文</span>
            </div>
          </div>
          <div
            className="threadPageText ql-editor"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </>
      )}
    </div>
  )
}

export default ThreadLi
