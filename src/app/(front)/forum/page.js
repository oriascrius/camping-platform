'use client'
import Header from '@/components/forum/Header'
import Userside from '@/components/forum/Userside'
import Forum from '@/components/forum/Forum'
import Footer from '@/components/forum/Footer'
import '@/styles/pages/forum/index.css'
import ForumList from '@/components/forum/ForumList'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // 確保載入 JavaScript
import Modalexpress from '@/components/forum/Modalexpress'


export default function ForumPage() {
  return (
    <>
      <Modalexpress/>
      <Header />
      <div className="container" id="forumListTop">
        <div className="d-flex justify-content-between">
          <Userside />
          <div className="forumUL">
            {/* <ForumList/> */}
            <Forum />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
