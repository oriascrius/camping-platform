'use client';
import { useState } from 'react';
import { HiOutlineUpload, HiX } from 'react-icons/hi';
import { 
  HiOutlineLocationMarker, 
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineCash
} from 'react-icons/hi';
import Image from 'next/image';
import Swal from 'sweetalert2';

export default function CampApplyForm() {
  // 當前步驟
  const [currentStep, setCurrentStep] = useState(1);
  
  // 表單資料狀態
  const [formData, setFormData] = useState({
    // 步驟一：基本資料
    name: '',                    // 營地名稱
    owner_name: '',             // 營主名稱
    address: '',                // 營地地址
    description: '',            // 營地描述
    image_url: '',             // 營地主圖
    
    // 步驟二：規則與須知
    rules: '',                  // 營地規則
    notice: '',                // 注意事項
    operation_status: 1,        // 營運狀態
    
    // 步驟三：營位資料
    spots: [{
      name: '',                // 營位名稱
      capacity: '',            // 容納人數
      price: '',               // 價格
      description: '',         // 營位描述
      images: [],              // 營位圖片
      status: 1                // 營位狀態
    }]
  });

  const [errors, setErrors] = useState({});  // 添加錯誤狀態

  // 添加預覽圖片的狀態
  const [previewImage, setPreviewImage] = useState('');
  const [previewSpotImages, setPreviewSpotImages] = useState({});

  // 步驟設定
  const steps = [
    {
      title: '基本資料',
      icon: HiOutlineLocationMarker,
      fields: ['name', 'owner_name', 'address', 'description', 'image_url']
    },
    {
      title: '規則與須知',
      icon: HiOutlineDocumentText,
      fields: ['rules', 'notice', 'operation_status']
    },
    {
      title: '營位設定',
      icon: HiOutlineCash,
      fields: ['spots']
    }
  ];

  // 營運狀態選項
  const operationStatusOptions = [
    { value: 1, label: '營業中' },
    { value: 2, label: '維護中' },
    { value: 3, label: '暫停營業' }
  ];

  // 渲染步驟指示器
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full
              ${currentStep > index + 1 
                ? 'bg-green-500 text-white' 
                : currentStep === index + 1
                  ? 'bg-[#6B8E7B] text-white'
                  : 'bg-gray-200 text-gray-500'}
            `}
          >
            <step.icon className="w-5 h-5" />
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-20 h-1 mx-2 
                ${currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`
            }
            />
          )}
        </div>
      ))}
    </div>
  );

  // 渲染當前步驟內容
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營地名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請輸入營地名稱"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營主名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請輸入營主名稱"
              />
              {errors.owner_name && <p className="mt-1 text-sm text-red-500">{errors.owner_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營地地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請輸入營地地址"
              />
              {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營地描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請描述您的營地特色"
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>

            {renderImageUpload()}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營地規則 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請輸入營地使用規則"
              />
              {errors.rules && <p className="mt-1 text-sm text-red-500">{errors.rules}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                注意事項 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="notice"
                value={formData.notice}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請輸入營地注意事項"
              />
              {errors.notice && <p className="mt-1 text-sm text-red-500">{errors.notice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營運狀態
              </label>
              <select
                name="operation_status"
                value={formData.operation_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
              >
                {operationStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            {formData.spots.map((spot, index) => (
              <div key={index} className="mb-8 p-6 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">營位 {index + 1}</h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSpot(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      刪除營位
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      營位名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={spot.name}
                      onChange={(e) => handleSpotChange(index, 'name', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                      placeholder="請輸入營位名稱"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      容納人數 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={spot.capacity}
                      onChange={(e) => handleSpotChange(index, 'capacity', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                      placeholder="請輸入容納人數"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      價格 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={spot.price}
                      onChange={(e) => handleSpotChange(index, 'price', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                      placeholder="請輸入價格"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      營位描述
                    </label>
                    <textarea
                      value={spot.description}
                      onChange={(e) => handleSpotChange(index, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                      placeholder="請描述營位特色"
                    />
                  </div>

                  {renderSpotImageUpload(index)}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddSpot}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg
                       text-gray-500 hover:border-[#6B8E7B] hover:text-[#6B8E7B]"
            >
              + 新增營位
            </button>
          </div>
        );
    }
  };

  // 處理步驟切換
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 驗證當前步驟
  const validateCurrentStep = () => {
    const currentFields = steps[currentStep - 1].fields;
    const newErrors = {};
    
    currentFields.forEach(field => {
      if (field === 'spots') {
        // 驗證營位資料...
      } else if (!formData[field]) {
        newErrors[field] = `請填寫${field}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單欄位變更
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除對應的錯誤訊息
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 處理營位資料變更
  const handleSpotChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      spots: prev.spots.map((spot, i) => 
        i === index ? { ...spot, [field]: value } : spot
      )
    }));
  };

  // 新增營位
  const handleAddSpot = () => {
    setFormData(prev => ({
      ...prev,
      spots: [...prev.spots, {
        name: '',
        capacity: '',
        price: '',
        description: '',
        images: [],
        status: 1
      }]
    }));
  };

  // 處理表單提交
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      const response = await fetch('/api/owner/camps/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '申請失敗');
      }

      await Swal.fire({
        icon: 'success',
        title: '申請成功',
        text: '您的營地申請已送出，我們將盡快審核',
        confirmButtonColor: '#6B8E7B',
      });

      // 重置表單
      window.location.reload();
    } catch (error) {
      console.error('申請失敗:', error);
      Swal.fire('錯誤', error.message || '申請失敗，請稍後再試', 'error');
    }
  };

  // 處理主圖上傳
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // 檢查檔案大小
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire('錯誤', '圖片大小不能超過 10MB', 'error');
        return;
      }

      // 檢查檔案類型
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        Swal.fire('錯誤', '只能上傳 JPG、PNG 或 GIF 格式的圖片', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/owner/camps/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '上傳失敗');
      }

      const data = await response.json();

      // 更新表單資料，只存儲檔案名稱
      setFormData(prev => ({
        ...prev,
        image_url: data.filename
      }));

      // 更新預覽圖片，使用完整 URL
      setPreviewImage(URL.createObjectURL(file));

    } catch (error) {
      console.error('上傳失敗:', error);
      Swal.fire('錯誤', error.message || '圖片上傳失敗，請稍後再試', 'error');
    }
  };

  // 處理營位圖片上傳
  const handleSpotImageUpload = async (index, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 驗證檔案數量
    if (files.length > 5) {
      Swal.fire('錯誤', '每個營位最多可上傳 5 張圖片', 'error');
      return;
    }

    try {
      const uploadedFilenames = [];
      const previewUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/owner/camps/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '上傳失敗');
        }

        const data = await response.json();
        uploadedFilenames.push(data.filename);
        previewUrls.push(URL.createObjectURL(file));
      }

      // 更新表單資料，只存儲檔案名稱
      setFormData(prev => ({
        ...prev,
        spots: prev.spots.map((spot, i) => 
          i === index 
            ? { ...spot, images: [...spot.images, ...uploadedFilenames] }
            : spot
        )
      }));

      // 更新預覽圖片
      setPreviewSpotImages(prev => ({
        ...prev,
        [index]: [...(prev[index] || []), ...previewUrls]
      }));

    } catch (error) {
      console.error('上傳失敗:', error);
      Swal.fire('錯誤', error.message || '圖片上傳失敗，請稍後再試', 'error');
    }
  };

  // 移除營位圖片
  const handleRemoveSpotImage = (spotIndex, imageIndex) => {
    // 更新表單資料
    setFormData(prev => ({
      ...prev,
      spots: prev.spots.map((spot, i) => 
        i === spotIndex 
          ? {
              ...spot,
              images: spot.images.filter((_, imgI) => imgI !== imageIndex)
            }
          : spot
      )
    }));

    // 更新預覽圖片
    setPreviewSpotImages(prev => ({
      ...prev,
      [spotIndex]: (prev[spotIndex] || []).filter((_, i) => i !== imageIndex)
    }));
  };

  // 在渲染圖片上傳區域時顯示預覽圖片
  const renderImageUpload = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        營地主圖 <span className="text-red-500">*</span>
      </label>
      <div 
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#6B8E7B] cursor-pointer"
        onClick={() => document.getElementById('campMainImage').click()}
      >
        {previewImage ? (
          <div className="relative">
            <img
              src={previewImage}
              alt="預覽圖片"
              className="max-h-48 rounded-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // 防止觸發父元素的點擊事件
                setPreviewImage('');
                setFormData(prev => ({ ...prev, image_url: '' }));
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1 text-center">
            <HiOutlinePhotograph className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <span className="relative rounded-md font-medium text-[#6B8E7B] hover:text-[#5F7A68]">
                上傳圖片
                <input
                  id="campMainImage"
                  type="file"
                  name="image"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </span>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF 最大 10MB</p>
          </div>
        )}
      </div>
      {errors.image_url && <p className="mt-1 text-sm text-red-500">{errors.image_url}</p>}
    </div>
  );

  // 營位圖片上傳區塊
  const renderSpotImageUpload = (index) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        營位圖片 <span className="text-red-500">*</span>
      </label>
      <div 
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#6B8E7B] cursor-pointer"
        onClick={() => document.getElementById(`spotImage-${index}`).click()}
      >
        <div className="space-y-1 text-center">
          <HiOutlinePhotograph className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <span className="relative rounded-md font-medium text-[#6B8E7B] hover:text-[#5F7A68]">
              上傳圖片
              <input
                id={`spotImage-${index}`}
                type="file"
                className="sr-only"
                accept="image/*"
                multiple
                onChange={(e) => handleSpotImageUpload(index, e)}
              />
            </span>
          </div>
          <p className="text-xs text-gray-500">可多選，PNG, JPG, GIF 最大 10MB</p>
        </div>
      </div>
      {/* 預覽圖片區域 */}
      {renderSpotImages(index)}
    </div>
  );

  // 在營位設定中顯示預覽圖片
  const renderSpotImages = (index) => (
    <div className="grid grid-cols-3 gap-4 mt-2">
      {previewSpotImages[index]?.map((url, imgIndex) => (
        <div key={imgIndex} className="relative">
          <img
            src={url}
            alt={`營位圖片 ${imgIndex + 1}`}
            className="w-full h-32 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() => handleRemoveSpotImage(index, imgIndex)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );

  // 移除營位
  const handleRemoveSpot = (index) => {
    setFormData(prev => ({
      ...prev,
      spots: prev.spots.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-[#2C4A3B] mb-6">
          {steps[currentStep - 1].title}
        </h2>
        {renderStepContent()}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrevStep}
          className={`px-6 py-2.5 border rounded-lg
            ${currentStep === 1 ? 'invisible' : 'visible'}
          `}
        >
          上一步
        </button>
        <button
          type="button"
          onClick={currentStep === steps.length ? handleSubmit : handleNextStep}
          className="px-6 py-2.5 bg-[#6B8E7B] text-white rounded-lg hover:bg-[#5F7A68]"
        >
          {currentStep === steps.length ? '提交申請' : '下一步'}
        </button>
      </div>
    </div>
  );
} 