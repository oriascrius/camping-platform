// import userImg from '/images/forum/photo_001.jpg'
const Userside = () => {
  return (
    <div className="userSide">
      <div className="avatar">
        <img 
          className="avatarAdaptive" 
          src="/images/forum/photo_001.jpg"
          alt="userName" 
        />
      </div>
      <p className="userName">生活獵人</p>
      <div
        className="btnUserName doExpress"
        data-bs-toggle="modal"
        data-bs-target="#expressModal"
      >
        <i className="fa-solid fa-message icon"></i>我要發文
      </div>
      <div className="btnUserName myExpress">
        <i className="fa-solid fa-user-large icon"></i>發文清單
      </div>
      <div className="btnUserName myCollect">
        <i className="fa-solid fa-heart icon"></i>收藏清單
      </div>
      <div className="btnUserName problemReport">
        <i className="fa-solid fa-circle-exclamation icon"></i>問題回報
      </div>
    </div>
  )
}

export default Userside
