'use client'

import { useState, useEffect } from 'react'
import Breadcrumbs from '../_components/breadcrumbs'
import Sidebar from '../_components/sidebar'
import ProductList from '../_components/ProductList'
import Pagination from '../_components/Pagination'
import '../styles/list.css'

export default function Home() {
  // 1️⃣ 新增狀態來存儲商品清單
  const [products, setProducts] = useState([])

  // 2️⃣ 定義 `fetchProducts` 來根據篩選條件獲取商品
  const fetchProducts = async (categoryId, subcategoryId) => {
    try {
      // 動態構造 API 查詢參數
      const query = new URLSearchParams()
      if (categoryId) query.append('categoryId', categoryId)
      if (subcategoryId) query.append('subcategoryId', subcategoryId)

      // 發送 API 請求
      const response = await fetch(`/api/products?${query.toString()}`)
      const data = await response.json()

      // 更新商品狀態
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  // 3️⃣ 頁面載入時加載所有商品
  useEffect(() => {
    fetchProducts() // 初始狀態載入所有商品
  }, [])

  return (
    <div>
      <div className="container">
        <Breadcrumbs />
        <div className="row">
          {/* 4️⃣ 將 `fetchProducts` 方法傳遞給 `Sidebar` 作為 `onFilter` */}
          <Sidebar onFilter={fetchProducts} />
          {/* 5️⃣ 傳遞 `products` 給 `ProductList` 來顯示商品清單 */}
          <ProductList products={products} />
        </div>
        <Pagination />
      </div>
    </div>
  )
}
