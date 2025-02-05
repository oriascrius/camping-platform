'use client'
import { useState, useEffect, useRef } from 'react'
import Quill from 'quill'
import ResizeModule from '@ssumo/quill-resize-module'
import 'quill/dist/quill.snow.css'

// 註冊 Resize 模組
Quill.register('modules/resize', ResizeModule)

const ModalReply = () => {
  const [editorData, setEditorData] = useState('') // 儲存編輯器內容的狀態
  const quillRef = useRef(null)
  const quillInstance = useRef(null)

  useEffect(() => {
    if (quillRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(quillRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['link', 'image'],
          ],
          resize: {
            locale: {
              altTip: '按住 Alt 鍵比例縮放',
              inputTip: '按 Enter 鍵確認',
              floatLeft: '靠左',
              floatRight: '靠右',
              center: '置中',
              restore: '還原',
            },
          },
        },
      })

      quillInstance.current.on('text-change', () => {
        setEditorData(quillInstance.current.root.innerHTML)
      })
    }
  }, [])

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
              <div className="threadContentInput">
                <i className="fa-solid fa-align-justify icon"></i> 討論內容：
                <br />
                {/* 討論內容輸入 (Quill 編輯器) */}
                <div className="editorContentArea" ref={quillRef}></div>
              </div>
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
                <button type="button" className="btn btnSubmit">
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
