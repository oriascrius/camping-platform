"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useProductCart } from "@/hooks/useProductCart"; // ✅ 引入購物車鉤子

import "../styles/detail.css";
import ComponentsImageSwiper from "../../../../components/products/imageSwiper";

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useProductCart(); // ✅ 取得 `addToCart` 函數

  // ✅ 讀取商品資訊
  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((error) => console.error("Error fetching product", error));
  }, [productId]);

  // ✅ 點擊「加入購物車」的處理函式
  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart(product.id, 1); // ✅ 呼叫 `addToCart`，加入 1 個
      alert("商品已加入購物車！"); // ✅ 提示用戶
    } catch (error) {
      console.error("加入購物車錯誤:", error);
      alert("加入購物車失敗，請稍後再試！");
    }
  };

  if (!product)
    return <div className="container mt-5 text-center">載入中...</div>;

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
            {/* ✅ 按鈕綁定 `handleAddToCart` */}
            <button className="btn btn-add-cart" onClick={handleAddToCart}>
              加入購物車
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
