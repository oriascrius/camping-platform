import { useState } from 'react'
import ReactQuill, { Quill } from 'react-quill' // 引入 ReactQuill 和 Quill 核心
import ImageResize from 'quill-image-resize-module-react' // 引入圖片大小調整模組
import 'react-quill/dist/quill.snow.css' // 引入 ReactQuill 的雪主題樣式

// 註冊 quill-image-resize-module-react 模組，讓 ReactQuill 可以使用
Quill.register('modules/imageResize', ImageResize)

const ModalReply = () => {
  const [editorData, setEditorData] = useState('') // 儲存編輯器內容的狀態

  // ReactQuill 的模組設定
  const modules = {
    toolbar: [
      [{ header: '1' }, { header: '2' }, { font: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['bold', 'italic', 'underline'],
      ['link', 'image'],
      ['clean'],
    ],
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize'],
    },
  }

  // ReactQuill 的格式設定
  const formats = [
    'header',
    'font',
    'bold',
    'italic',
    'underline',
    'align',
    'list',
    'bullet',
    'link',
    'image',
    'clean',
  ]

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
                <ReactQuill
                  value={editorData}
                  onChange={setEditorData} // 更新編輯器內容
                  modules={modules} // 使用模組設定
                  formats={formats} // 使用格式設定
                  placeholder="請輸入回覆內容..."
                  className="form-control editorContentArea"
                />
              </div>
            </div>
            <div className="modal-footer border-0 justify-content-between">
              <p>討論請注意禮節與尊重他人，良好的交流需要你我共同維護。</p>
              <span>
                <button
                  type="button"
                  className="btn btnCancel  me-2"
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
