'use client'
import '@/styles/pages/forum/index.css'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import ThreadLi from '@/components/forum/ThreadLi'
import PaginationArea from '@/components/forum/PaginationArea'
import Header from '@/components/forum/Header'
import Footer from '@/components/forum/Footer'
import Userside from '@/components/forum/Userside'
import Modalexpress from '@/components/forum/Modalexpress'
import ModalReply from '@/components/forum/ModalReply'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import ThreadList from '@/components/forum/ThreadList'
import EditExpressModal from '@/components/forum/EditExpressModal'
import EditReplyModal from '@/components/forum/EditReplyModal'

export default function ThreadPage() {
  const { id } = useParams()
  const [threadData, setThreadData] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [dataFromThreadLi, setDataFromThreadLi] = useState('') // 設定狀態以取得從 ThreadLi 元件來的 樓主 資料
  const [dataFromThreadLiRelay, setDataFromThreadLiRelay] = useState('') // 設定狀態已取得從 ThreadLi 元件來的 回覆 資料

  const fetchThreadData = async () => {
    try {
      const response = await fetch(`/api/forum/thread/${id}`)
      const data = await response.json()

      if (response.ok) {
        setThreadData({
          thread: data.thread,
          replies: data.replies,
        })
      } else {
        console.error('Error fetching thread:', data.error)
        setThreadData(null)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThreadData()
  }, [id])

  if (loading) return <div>Loading...</div>
  if (!threadData) return <div>該帖子不存在</div>

  const combinedData = [threadData.thread, ...threadData.replies]
  const itemsPerPage = 10
  const totalPages = Math.ceil(combinedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = combinedData.slice(startIndex, endIndex)

  return (
    <>
      <Modalexpress />
      <ModalReply 
        threadId={id} 
        onUpdateSuccess={fetchThreadData}
      />
      <EditExpressModal
        data={dataFromThreadLi}
        onUpdateSuccess={fetchThreadData}
      />
      <EditReplyModal
        ReplyData={dataFromThreadLiRelay}
        onUpdateSuccess={fetchThreadData}
      />
      {/* <Header /> */}
      <div className="container" id="forumListTop">
        <div className="d-flex justify-content-between align-items-start">
          <Userside />
          <div className="forumUL">
            <ThreadList />
            {currentData.map((item, index) => (
              <ThreadLi
                key={index}
                item={item}
                threadId={id}
                setData={setDataFromThreadLi}
                setReplyData={setDataFromThreadLiRelay}
              />
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
      {/* <Footer /> */}
    </>
  )
}
