import { useSession } from "next-auth/react";

const Userside = () => {
  const { data: session, status } = useSession();

  console.log("登入狀態:", status);
  console.log("使用者資訊:", session);
  console.log(session?.user?.image);

  return (
    <div className="userSide">
      <div className="avatar">
        <img 
          className="avatarAdaptive" 
          src={'/images/member/'+session?.user?.image || "/images/member/guest-user.png"}
          alt={session?.user?.name || "未登入"} 
        />
      </div>
      <p className="userName">
        {session ? session.user.name : "請先登入"}
      </p>
      {session ?
      <div
      className="btnUserName doExpress"
      data-bs-toggle="modal"
      data-bs-target="#expressModal"
      >
        <i className="fa-solid fa-message icon"></i>我要發文
      </div> : 
      <div
      className="btnUserName doExpressNon"
      onClick={() => alert("請先登入!")}
      >
        <i className="fa-solid fa-message icon"></i>我要發文
      </div>
      }
      
      {session ? 
      <div className="btnUserName myExpress">
        <i className="fa-solid fa-user-large icon"></i>發文清單
      </div> : ""
      }
      {session ? 
      <div className="btnUserName myCollect">
        <i className="fa-solid fa-heart icon"></i>收藏清單
      </div> : ""
      }
      {session ? 
        <div className="btnUserName problemReport">
        <i className="fa-solid fa-circle-exclamation icon"></i>問題回報
      </div> : ""
      }
    </div>
  );
};

export default Userside;
