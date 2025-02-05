'use client'
import { useState, useEffect, useRef } from 'react'
import Quill from 'quill'
import ResizeModule from '@ssumo/quill-resize-module'
import 'quill/dist/quill.snow.css'

// 註冊 Resize 模組
Quill.register('modules/resize', ResizeModule)

const Modalexpress = () => {
  const [imagePreview, setImagePreview] = useState('')
  const [editorData, setEditorData] = useState('')
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

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetImagePreview = () => {
    setImagePreview('')
  }

  return (
    <>
      <div
        className="modal fade"
        id="expressModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title" id="exampleModalLabel">
                新增討論
              </h5>
            </div>
            <div className="modal-body pt-1 pb-0">
              {/* 討論分類、發文分類 */}
              <div className="categoryBox d-flex align-items-center">
                <i className="fa-solid fa-list-ul icon"></i>討論分類：
                <select className="form-select selectType me-5">
                  <option value="0">請選擇</option>
                  <option value="01">好物分享</option>
                  <option value="02">營地見聞</option>
                  <option value="03">活動揪團</option>
                  <option value="04">露營知識</option>
                  <option value="05">露友閒聊</option>
                </select>
                發文分類：
                <select className="form-select selectType">
                  <option value="0">請選擇</option>
                  <option value="01">心得</option>
                  <option value="02">問題</option>
                  <option value="03">討論</option>
                  <option value="04">情報</option>
                  <option value="05">閒聊</option>
                </select>
              </div>

              {/* 封面圖片上傳、預覽 */}
              <div className="threadImg d-flex align-items-end">
                <div className="updateImg">
                  <i className="fa-solid fa-image icon"></i>封面圖片：
                  <br />
                  <form>
                    <input
                      type="file"
                      className="form-control inputImg"
                      onChange={handleImageChange}
                      accept="image/gif, image/jpeg, image/jpg"
                    />
                    <button
                      type="button"
                      className="btnReset"
                      onClick={resetImagePreview}
                    >
                      清空
                    </button>
                  </form>
                </div>
                <div className="threadImgPreview">
                  <img
                    id="preview_img"
                    className="imgPreview"
                    src={imagePreview || '#'}
                    alt="Preview"
                  />
                </div>
              </div>

              {/* 討論標題輸入 */}
              <div className="threadTitleInput">
                <i className="fa-solid fa-message icon"></i>討論題目：
                <br />
                <input
                  type="text"
                  className="form-control mt-2"
                  placeholder="請輸入標題名稱..."
                />
              </div>

              {/* 討論內容輸入 (Quill 編輯器) */}
              <div className="threadContentInput">
                <i className="fa-solid fa-align-justify icon"></i>討論內容：
                <br />
                <div className="editorContentArea" ref={quillRef}></div>
              </div>
            </div>

            {/* Modal Footer */}
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

export default Modalexpress
