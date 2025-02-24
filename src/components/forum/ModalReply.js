'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

// 動態載入 SunEditor，避免 SSR 錯誤
const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false })
import 'suneditor/dist/css/suneditor.min.css'
import { picmo } from 'suneditor-picmo-emoji'

const ModalReply = ({threadId}) => {
  const { data: session } = useSession()
  const [editorData, setEditorData] = useState('')


  useEffect(() => {
    // console.log("收到的 threadId:", threadId);
    // 這裡可以用 threadId 來讀取該文章的回覆資料
  }, [threadId]);




  const handleSubmit = async () => {
    if (!editorData) {
      alert('請填寫所有必要欄位')
      return
    }

    const formData = new FormData()
    formData.append('threadId', threadId)
    formData.append('userId', session?.user?.id || '')
    formData.append('userName', session?.user?.name || '測試用戶')
    formData.append('userAvatar', session?.user?.image)
    formData.append('threadContent', editorData)
   

    try {
      const res = await fetch('/api/forum/reply', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success) {
        alert('回覆成功！')
        window.location.reload()
      } else {
        alert('回覆失敗，請稍後再試')
      }
    } catch (error) {
      console.error('發文失敗:', error)
      alert('回覆失敗，請稍後再試')
    }
  }

  const uploadImageToServer = async (file, uploadHandler) => {
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/forum/uploadContentImage', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        uploadHandler({ result: [{ url: data.imageUrl }] })
      } else {
        alert('圖片上傳失敗')
      }
    } catch (error) {
      console.error('圖片上傳錯誤:', error)
      alert('圖片上傳錯誤')
    }
  }

  const resetForm = () => {
    setEditorData('')
  }

  return (
    <>
      <div
        className="modal fade"
        id="replyModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title" id="exampleModalLabel">
                新增回覆
              </h5>
            </div>
            <div className="modal-body pt-1 pb-0">
              <i className="fa-solid fa-align-justify icon"></i>回覆內容：
              <br></br>
              {/* SunEditor 編輯器 */}
              <SunEditor
                setContents={editorData}
                onChange={setEditorData}
                setOptions={{
                  buttonList: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'removeFormat'],
                    ['font', 'fontSize', 'formatBlock'],
                    ['image', 'link', 'table'],
                    ['picmo'],
                  ],
                  plugins: [picmo],
                  minHeight: '200px',
                }}
                onImageUploadBefore={(files, info, uploadHandler) => {
                  // info.preventDefault() // 確保 info.preventDefault() 可用
                  uploadImageToServer(files[0], uploadHandler)
                }}
              />
            </div>

            <div className="modal-footer border-0 justify-content-between">
              <p>討論請注意禮節與尊重他人，良好的交流需要你我共同維護。</p>
              <span>
                <button
                  type="button"
                  className="btn btnCancel me-2"
                  data-bs-dismiss="modal"
                >
                  取消
                </button>
                <button
                  type="button"
                  className="btn btnCancel me-2"
                  onClick={resetForm}
                >
                  清空
                </button>
                <button
                  type="button"
                  className="btn btnSubmit"
                  onClick={handleSubmit}
                >
                  送出
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ModalReply
