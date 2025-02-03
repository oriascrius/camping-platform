const ThreadList = () => {
  return (
    <div className="forumList">
      <div className="forumMenu d-flex align-items-center px-3">
        <div
          className="doReply"
          data-bs-toggle="modal"
          data-bs-target="#replyModal"
        >
          <i className="fa-solid fa-comment-dots icon"></i>我要回覆
        </div>
        <div className="doCollect">
          <i className="fa-solid fa-heart"></i>收藏文章
        </div>
      </div>
    </div>
  )
}
export default ThreadList
