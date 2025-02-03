import { useState } from 'react'
import ReactQuill, { Quill } from 'react-quill' // 引入 ReactQuill 和 Quill 核心
import ImageResize from 'quill-image-resize-module-react' // 引入圖片大小調整模組
import 'react-quill/dist/quill.snow.css' // 引入 ReactQuill 的雪主題樣式

// 註冊 quill-image-resize-module-react 模組，讓 ReactQuill 可以使用
Quill.register('modules/imageResize', ImageResize)

const Modalexpress = () => {
  // 狀態：儲存圖片預覽的 URL
  const [imagePreview, setImagePreview] = useState('')
  // 狀態：儲存 ReactQuill 編輯器的內容
  const [editorData, setEditorData] = useState('')

  // 處理圖片選擇事件
  const handleImageChange = (e) => {
    const file = e.target.files[0] // 取得使用者選擇的檔案
    if (file) {
      const reader = new FileReader() // 建立 FileReader 物件
      reader.onloadend = () => {
        setImagePreview(reader.result) // 將圖片 Data URL 設定為預覽
      }
      reader.readAsDataURL(file) // 讀取檔案內容
    }
  }

  // 清空圖片預覽
  const resetImagePreview = () => {
    setImagePreview('')
  }

  // ReactQuill 的模組設定
  const modules = {
    toolbar: [
      [{ header: '1' }, { header: '2' }, { font: [] }], // 設定標題、字型
      [{ list: 'ordered' }, { list: 'bullet' }], // 設定有序列表、無序列表
      [{ align: [] }], // 設定對齊方式
      ['bold', 'italic', 'underline'], // 設定粗體、斜體、底線
      ['link', 'image'], // 設定連結、圖片 (加入圖片按鈕)
      ['clean'], // 設定清除格式
    ],
    imageResize: {
      // 圖片大小調整模組設定
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize'], // 啟用調整大小和顯示尺寸功能
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
    'clean', // 支援的格式
  ]

  return (
    <>
      {/* Modal Express */}
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
                <select className="form-select selectType me-5" name="" id="">
                  {/* ... 分類選項 ... */}
                  <option value="0">請選擇</option>
                  <option value="01">好物分享</option>
                  <option value="02">營地見聞</option>
                  <option value="03">活動揪團</option>
                  <option value="04">露營知識</option>
                  <option value="05">露友閒聊</option>
                </select>
                發文分類：
                <select className="form-select selectType" name="" id="">
                  {/* ... 分類選項 ... */}
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
                      onChange={handleImageChange} // 觸發圖片選擇處理
                      accept="image/gif, image/jpeg, image/jpg"
                    />
                    <button
                      type="button"
                      className="btnReset"
                      onClick={resetImagePreview} // 觸發清空圖片
                    >
                      清空
                    </button>
                  </form>
                </div>
                <div className="threadImgPreview">
                  <img
                    id="preview_img"
                    className="imgPreview"
                    src={imagePreview || '#'} // 顯示預覽，沒有圖片則顯示 #
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

              {/* 討論內容輸入 (ReactQuill 編輯器) */}
              <div className="threadContentInput">
                <i className="fa-solid fa-align-justify icon"></i>討論內容：
                <br />
                <ReactQuill
                  value={editorData}
                  onChange={setEditorData} // 更新編輯器內容
                  modules={modules} // 使用模組設定
                  formats={formats} // 使用格式設定
                  placeholder="請輸入討論內容..."
                  className="form-control editorContentArea"
                />
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
