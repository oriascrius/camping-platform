'use client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// 基本組件引入
import Modalexpress from '@/components/forum/Modalexpress'
import Header from '@/components/forum/Header'
import Userside from '@/components/forum/Userside'
import ForumList from '@/components/forum/ForumList'
import Footer from '@/components/forum/Footer'
import Forum from '@/components/forum/Forum'
import Thread from '@/components/forum/Thread'
import ThreadList from '@/components/forum/ThreadList'
import ModalReply from '@/components/forum/ModalReply'
import '@/styles/pages/forum/index.css'

function App() {
  return (
    <Router>
      <Modalexpress />
      <ModalReply />
      <Header />

      <div className="container" id="forumListTop">
        <div className="d-flex justify-content-between">
          <Userside />
          <div className="forumUL">
            <Routes>
              <Route
                path="/forum"
                element={
                  <>
                    <ForumList />
                    <Forum />
                  </>
                }
              />
              <Route
                path="/thread/:id"
                element={
                  <>
                    <ThreadList />
                    <Thread />
                  </>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
      <Footer />
    </Router>
  )
}

export default App
