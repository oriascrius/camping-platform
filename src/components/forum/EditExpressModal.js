'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// 動態載入 SunEditor，避免 SSR 錯誤
const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false })
import 'suneditor/dist/css/suneditor.min.css'

const EditExpressModal = ( {data , setExpressDataReturn} ) => {

    const [modalData, setModalData] = useState({
        id: '',
        category_id: '0',
        type_id: '0',
        thread_image: '#',
        thread_title: '',
        thread_content: '',
        status: '',
    })

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (data) {
            setModalData({
                id: data.id || '',
                category_id: data.category_id || '0',
                type_id: data.type_id || '0',
                thread_image: data.thread_image || '',
                thread_title: data.thread_title || '',
                thread_content: data.thread_content || '',
                status: data.status || '',
            })
            setEditorData(data.thread_content || '') // 初始化文章內容
            setImagePreview(data.thread_image || '') // 初始化圖片
            setTitleType(data.type_id || '0')        // 初始化標題分類
            setCategory(data.category_id || '0')     // 初始化文章分類
            setTitle(data.thread_title || '')        // 初始化標題文字
        }
    }, [data]) // 只有當 data 變更時才更新 modalData

    /*
    // 處理輸入變更
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setModalData((prev) => ({ ...prev, [name]: value }))
    }
    */

    /*
    // 預覽圖片起始設定
    const [imagePreview, setImagePreview] = useState(modalData.thread_image || defaultImages[typeId])
    const [uploadImage, setUploadImage] = useState(null)

    // 處理封面圖片變更
    const handleImageChange = (e) => {
        
    }
    // 清空封面圖片及預覽
    const resetImagePreview = () => {

    }
    // 上傳封面圖片
    const uploadImageFile = async () => {
        if (!uploadImage) return getFinalImage()

        const formData = new FormData()
        formData.append('image', uploadImage)

        try {
            const res = await fetch('/api/forum/uploadImage', {
            method: 'POST',
            body: formData,
            })
            const data = await res.json()
            return data.imageUrl || getFinalImage()
        } catch (error) {
            return getFinalImage()
        }
    }
    */

    /*
    // 封面圖片對應改動
    const [uploadImage, setUploadImage] = useState(null)
    const [typeId, setTypeId] = useState(modalData.type_id || 1)
    const [imagePreview, setImagePreview] = useState(modalData.thread_image || defaultImages[typeId])
    // 監聽 typeId 變化，當 imagePreview 為空時，使用對應預設圖片
    useEffect(() => {
        if (!imagePreview) {
            setImagePreview(defaultImages[typeId] || defaultImages[1]); // 預防 typeId 超出範圍
        }
    }, [typeId]);

    // 預設圖片對應表
    const defaultImages = {
        1: '/images/forum/liImg_sample_01.png',
        2: '/images/forum/liImg_sample_02.png',
        3: '/images/forum/liImg_sample_03.png',
        4: '/images/forum/liImg_sample_04.png',
        5: '/images/forum/liImg_sample_05.png',
    }

    // 取得對應類型的預設圖片
    const getDefaultImage = () => defaultImages[modalData.type_id] || ''

    // 取得最終的封面圖片
    const getFinalImage = () => {
        if (uploadImage) return imagePreview // 使用者上傳圖片
        if (modalData.type_id !== data.type_id) return getDefaultImage() // 類型變更
        return modalData.thread_image // 維持原始圖片
    }

    // 處理封面圖片變更
    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
            setUploadImage(file)
        } else {
            setImagePreview(defaultImages[typeId]); // 如果沒有選擇圖片，回到預設封面
        }
    }

    // 清空封面圖片及預覽
    const resetImagePreview = () => {
        setImagePreview(defaultImages[typeId])
        setUploadImage(null)
        setModalData(prevData => ({ ...prevData, thread_image: '#' }))
    }

    // 上傳圖片至伺服器
    const uploadImageFile = async () => {
        if (!uploadImage) return getFinalImage()

        const formData = new FormData()
        formData.append('image', uploadImage)

        try {
            const res = await fetch('/api/forum/uploadImage', {
            method: 'POST',
            body: formData,
            })
            const data = await res.json()
            return data.imageUrl || getFinalImage()
        } catch (error) {
            return getFinalImage()
        }
    }
    */

    /*
    // console.log('文章 id  = ' + modalData?.id);
    // console.log('文章類型 = ' + modalData?.category_id)
    // console.log('標題分類 = ' + modalData?.type_id)
    // console.log('標題圖片 = ' + modalData?.thread_image)
    // console.log('標題文字 = ' + modalData?.thread_title)
    // console.log('文章內容 = ' + modalData?.thread_content)
    // console.log('文章狀態 = ' + modalData?.status)
    */
    
    // 更新文章
    const handleUpdateThread = async () => {

        const threadImage = await uploadImageFile()

        try {
            const response = await fetch(`/api/forum/update-express`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    threadId: modalData.id,
                    categoryId: category,
                    typeId: titleType,
                    threadImg: threadImage,
                    title: title,
                    content: editorData,
                    status: modalData.status
                }),
            });

            const result = await response.json();
            if (response.ok) {
                alert('文章更新成功！');
                // console.log(modalData);
                window.location.reload();  // 重新載入頁面
                // const returnData = {
                //     threadId: modalData.id,
                //     categoryId: category,
                //     typeId: titleType,
                //     threadImg: threadImage,
                //     title: title,
                //     content: editorData,
                //     status: modalData.status
                // }
                // setExpressDataReturn(returnData)
                // console.log(returnData);
            } else {
                throw new Error(result.message || '更新失敗');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    








    // const getDefaultImage = () => {
    //     if (imagePreview) return imagePreview
    //     const defaultImages = {
    //         1: '/images/forum/liImg_sample_01.png',
    //         2: '/images/forum/liImg_sample_02.png',
    //         3: '/images/forum/liImg_sample_03.png',
    //         4: '/images/forum/liImg_sample_04.png',
    //         5: '/images/forum/liImg_sample_05.png',
    //     }
    //     return defaultImages[titleType]
    // }
    

    /*
    const handleSubmit = async () => {
        if (category === '0' || titleType === '0' || !title || !editorData) {
            alert('請填寫所有必要欄位')
            return
        }

        const threadImage = await uploadImageFile()

        const formData = new FormData()
        formData.append('userId', session?.user?.id || '')
        formData.append('userName', session?.user?.name || '測試用戶')
        formData.append('userAvatar', session?.user?.image)
        formData.append('category', category)
        formData.append('titleType', titleType)
        formData.append('threadTitle', title)
        formData.append('threadContent', editorData)
        formData.append('threadImage', threadImage)

        try {
            const res = await fetch('/api/forum/create', {
            method: 'POST',
            body: formData,
            })
            const data = await res.json()

            if (data.success) {
            alert('發文成功！')
            window.location.reload()
            } else {
            alert('發文失敗，請稍後再試')
            }
        } catch (error) {
            console.error('發文失敗:', error)
            alert('發文失敗，請稍後再試')
        }
    }
    */

    // 文章內容圖片上傳操作
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

    // const resetForm = () => {
    //     setTitle('')
    //     setEditorData('')
    //     setTitleType('0')
    //     setCategory('0')
    //     setImagePreview('')
    //     setUploadImage(null)
    // }


    // -------------------------------------------------------------------------------------------------------------------
    // 變更文章內容重現方式
    const [category, setCategory] = useState('0')
    const [title, setTitle] = useState('')
    const [editorData, setEditorData] = useState('')
    const [originImage, setOriginImage] = useState(1)
    // 複刻封面圖片操作機制開始
    const [imagePreview, setImagePreview] = useState('') // 宣告使用者上傳圖片的變數 = imagePreview
    const [uploadImage, setUploadImage] = useState(null) // 宣告使用者自定義封面圖片上傳至伺服器的變數 = uploadImage
    const [titleType, setTitleType] = useState('0') // 宣告使用者設定標題分類的變數 = titleType
    // 宣告預覽圖片的變數 = getDefaultImage()
    const getDefaultImage = () => {
        if (imagePreview == '/images/forum/liImg_sample_01.png' && originImage == 1) {
            setImagePreview(null)
        }
        if (imagePreview == '/images/forum/liImg_sample_02.png' && originImage == 1) {
            setImagePreview(null)
        }
        if (imagePreview == '/images/forum/liImg_sample_03.png' && originImage == 1) {
            setImagePreview(null)
        }
        if (imagePreview == '/images/forum/liImg_sample_04.png' && originImage == 1) {
            setImagePreview(null)
        }
        if (imagePreview == '/images/forum/liImg_sample_05.png' && originImage == 1) {
            setImagePreview(null)
        }
        if (imagePreview) return imagePreview    
        const defaultImages = {
            1: '/images/forum/liImg_sample_01.png',
            2: '/images/forum/liImg_sample_02.png',
            3: '/images/forum/liImg_sample_03.png',
            4: '/images/forum/liImg_sample_04.png',
            5: '/images/forum/liImg_sample_05.png',
        }
        return defaultImages[titleType]
        
    }
    // 宣告使用者自訂封面圖片的操作
    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onloadend = () => {
            setImagePreview(reader.result) // 使用者選擇好圖片之後定義 setImagePreview()
          }
          reader.readAsDataURL(file)
          setUploadImage(file) // 使用者選擇好圖片之後定義 setUploadImage()
        }
    }
    // 宣告使用者自定義封面圖片上傳至伺服器的操作
    const uploadImageFile = async () => {
        if (!uploadImage) return getDefaultImage()
    
        const formData = new FormData()
        formData.append('image', uploadImage)
    
        try {
          const res = await fetch('/api/forum/uploadImage', {
            method: 'POST',
            body: formData,
          })
          const data = await res.json()
          return data.imageUrl || getDefaultImage()
        } catch (error) {
          return getDefaultImage()
        }
    }
    // 宣告清除預覽封面圖片的操作
    const resetImagePreview = () => {
        
        setImagePreview('')
        setOriginImage(0)
        getDefaultImage()
        setUploadImage(null)
    }

    // 複刻封面圖片操作機制結束
    // 標題文字製作
    const title_type_name = {
        1: '心得',
        2: '問題',
        3: '討論',
        4: '情報',
        5: '閒聊',
    }
    // -------------------------------------------------------------------------------------------------------------------

    return (
        <>
            <div
            className="modal fade"
            id="editExpressModal"
            tabIndex="-1"
            aria-labelledby="exampleModalLabel"
            aria-hidden="true"
            >
            <div className="modal-dialog modal-xl">
                <div className="modal-content border-0">
                <div className="modal-header border-0 pb-0">
                    <h5 className="modal-title" id="exampleModalLabel">
                    修改討論
                    </h5>
                </div>
                <div className="modal-body pt-1 pb-0">
                    <div className="categoryBox d-flex align-items-center">
                    <i className="fa-solid fa-list-ul icon"></i>討論分類：
                    <select
                        name="category_id"
                        className="form-select selectType me-5"
                        onChange={(e) => setCategory(e.target.value)}
                        value={category} // 確保 value 綁定 category
                    >
                        <option value="0">請選擇</option>
                        <option value="1">好物分享</option>
                        <option value="2">營地見聞</option>
                        <option value="3">活動揪團</option>
                        <option value="4">露營知識</option>
                        <option value="5">露友閒聊</option>
                    </select>
                    發文分類：
                    <select
                        name="type_id"
                        className="form-select selectType"
                        onChange={(e) => {setTitleType(e.target.value)}}
                        value={titleType} // 確保 value 綁定 type_id
                    >
                        <option value="0">請選擇</option>
                        <option value="1">心得</option>
                        <option value="2">問題</option>
                        <option value="3">討論</option>
                        <option value="4">情報</option>
                        <option value="5">閒聊</option>
                    </select>
                    </div>
                    <div className="threadImg d-flex align-items-end mb-3">
                    <span>
                        <i className="fa-solid fa-image icon"></i>封面圖片：<br></br>
                        <input
                        type="file"
                        className="form-control inputImg"
                        onChange={handleImageChange} // 處理封面圖片變更
                        accept="image/*"
                        />
                    </span>

                    <button
                        type="button"
                        className="btnReset"
                        onClick={resetImagePreview}
                    >
                        清空
                    </button>
                    <div className="forumLiBox1 express">
                        <div className="thread_image">
                        <img
                            id="preview_img"
                            className="imgPreview"
                            src={getDefaultImage() || '#'}  // 預覽圖片的變數 = getDefaultImage()
                            alt="Preview"
                        />
                        </div>
                    </div>
                    </div>
                    <i className="fa-solid fa-message icon"></i>討論題目：【{title_type_name[titleType]}】<br></br>
                    <input
                    type="text"
                    name="thread_title"
                    className="form-control mt-1 mb-3"
                    placeholder="請輸入標題名稱..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    />
                    <i className="fa-solid fa-align-justify icon"></i>討論內容：
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
                        ],
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
                        <div className="form-check d-inline-block me-2">
                            <input type="checkbox" className="form-check-input" id="exampleCheck1" />
                            <label className="form-check-label" htmlFor="exampleCheck1"><p>下架討論串</p></label>
                        </div>
                        <button
                            type="button"
                            className="btn btnCancel me-2"
                            data-bs-dismiss="modal"
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            className="btn btnSubmit"
                            onClick={handleUpdateThread}
                        >
                            更新
                        </button>
                    </span>
                </div>
                </div>
            </div>
            </div>
        </>
    )
}

export default EditExpressModal
