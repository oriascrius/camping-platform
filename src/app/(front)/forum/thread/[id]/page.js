'use client'
import '@/styles/pages/forum/index.css'
import { useParams } from 'next/navigation'
import { forumData, commentsData } from '@/data/forum/data'
import ThreadLi from '@/components/forum/ThreadLi'
import PaginationArea from '@/components/forum/PaginationArea'
import Header from '@/components/forum/Header'
import Footer from '@/components/forum/Footer'
import { useState } from 'react'
import Userside from '@/components/forum/Userside'
import ThreadList from '@/components/forum/ThreadList'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // 確保載入 JavaScript
import Modalexpress from '@/components/forum/Modalexpress'
import ModalReply from '@/components/forum/ModalReply'


export default function ThreadPage() {
  const params = useParams()
  const id = params.id // 取得網址上的 id 參數

  const thread = forumData.find((forum) => forum.thread_id === parseInt(id))

  if (!thread) {
    return <div>該帖子不存在</div>
  }

  const [currentPage, setCurrentPage] = useState(1)

  const combinedData = [
    thread,
    ...commentsData.filter((comment) => comment.thread_id === thread.thread_id),
  ]

  const itemsPerPage = 10
  const totalPages = Math.ceil(combinedData.length / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = combinedData.slice(startIndex, endIndex)

  return (
    <>
      <Modalexpress/>
      <ModalReply/>
      <Header />
      <div className="container" id="forumListTop">
        <div className="d-flex justify-content-between">    
            <Userside/>
                <div className="forumUL">
                    <ThreadList/>
                    {currentData.map((item, index) => (
                    <ThreadLi key={index} item={item} />
                    ))}
                    {totalPages > 1 && (
                    <PaginationArea
                        totalPages={totalPages}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                    />
                    )}
                </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
