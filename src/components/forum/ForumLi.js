import Link from 'next/link'
import { forumData } from '@/data/forum/data'

const ForumLi = ({ currentPage, itemsPerPage }) => {
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = forumData.slice(startIndex, endIndex)

  return currentData.map((forum) => {
    const {
      thread_id,
      typeBox,
      pinned,
      featured,
      img,
      threadTitle,
      threadContent,
      avatarAdaptive,
      threadUserName,
      threadDate,
      threadTime,
    } = forum

    return (
      <Link
        key={thread_id}
        href={`/forum/thread/${thread_id}`}
        className="forumLi hover d-flex justify-content-between linkStyle"
      >
        <div className="forumLiBox1 d-flex justify-content-between align-items-center">
          <div className="liTitle d-flex flex-wrap justify-content-between">
            <div className="typeBox">
              <i className="fa-solid fa-tag icon"></i>
              {typeBox}
            </div>

            {pinned === 1 && (
              <div className="pinned mt-2">
                <i className="fa-solid fa-arrow-up"></i> 置頂
              </div>
            )}

            {featured === 1 && (
              <div className="featured mt-2">
                <i className="fa-solid fa-star"></i> 精華
              </div>
            )}
          </div>
          <img src={img} alt={threadTitle} />
        </div>
        <div className="forumLiBox2">
          <div className="threadTitle">{threadTitle}</div>
          <hr className="threadLine" />
          <div className="threadContent">{threadContent}</div>
        </div>
        <div className="forumLiBox3">
          <div className="threadAvatar">
            <img
              className="avatarAdaptive"
              src={avatarAdaptive}
              alt={threadUserName}
            />
          </div>
          <p className="threadUserName">{threadUserName}</p>
          <p className="threadDate">
            {threadDate}
            <span className="threadTime">{threadTime}</span>
          </p>
        </div>
      </Link>
    )
  })
}

export default ForumLi
