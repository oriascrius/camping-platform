'use client'
import Userside from '@/components/forum/Userside'
import Forum from '@/components/forum/Forum'
import '@/styles/pages/forum/index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // 確保載入 JavaScript
import Modalexpress from '@/components/forum/Modalexpress'
import ChatRoom from '@/components/forum/ChatRoom';


export default function ForumPage() {
  
  return (
    <>
      <Modalexpress/>
      <ChatRoom />
      <div className="container" id="forumListTop">
        <div className="d-flex justify-content-between align-items-start">
          <Userside />
          <div className="forumUL">
            {/* <ForumList/> */}
            <Forum />
          </div>
        </div>
      </div>
    </>
  )
}
