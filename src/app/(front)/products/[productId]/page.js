'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

import '../styles/detail.css'
import ComponentsImageSwiper from '../_components/imageSwiper'

export default function ProductDetail() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((error) => console.error('Error fetching product', error))
  }, [productId])

  if (!product)
    return <div className="container mt-5 text-center">載入中...</div>

  return (
    <div className="container mt-5">
      <div className="row">
        {/* 主圖片輪播 */}
        <div className="col-lg-8">
          <ComponentsImageSwiper product={product} />
        </div>

        {/* 商品資訊 */}
        <div className="col-lg-4 p-info">
          <div>
            <h2 className="text-p-name">{product.name}</h2>
          </div>
          <div className="mt-5">
            <h4 className="text-p-price">${product.price}</h4>
          </div>
          <div className="mt-5">
            <p>{product.description}</p>
          </div>
          <div className="mt-5">
            <button className="btn btn-add-cart">加入購物車</button>
          </div>
        </div>
      </div>
    </div>
  )
}
