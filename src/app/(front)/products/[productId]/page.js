"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useProductCart } from "@/hooks/useProductCart"; // ✅ 引入購物車鉤子

import "../styles/detail.css";
import ComponentsImageSwiper from "../../../../components/products/imageSwiper";
import { showCartAlert } from "@/utils/sweetalert"; // 老大做好的 SweetAlert

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  //數量狀態
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useProductCart(); // ✅ 取得 `addToCart` 函數

  // ✅ 讀取商品資訊
  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((error) => console.error("Error fetching product", error));
  }, [productId]);

  // ✅ 點擊「加入購物車」的處理函式
  const handleAddToCart = async (quantity) => {
    if (!product) return;

    try {
      const success = await addToCart(product.id, quantity); // ✅ `addToCart()` 若回傳 `false`，代表未登入
      if (!success) return; // ✅ 未登入時，直接結束，不跳出「商品已加入購物車！」

      showCartAlert.success("商品已加入購物車！"); // ✅ 只有成功加入時才顯示
    } catch (error) {
      console.error("加入購物車錯誤:", error);
      showCartAlert.error("加入購物車失敗，請稍後再試！");
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
            <p className="text-p-description">{product.description}</p>
          </div>

          <div className="mt-5">
            <p className="text-p-stock">剩餘庫存 : {product.stock}</p>
          </div>

          {/* 數量 */}
          <div className="quantity item-style d-flex mt-5">
            <button
              onClick={() => {
                if (quantity <= 1) return;
                setQuantity(quantity - 1);
              }}
            >
              -
            </button>
            <input
              className="w-100 text-center"
              type="text"
              value={quantity}
              readOnly
            />
            <button
              onClick={() => {
                if (quantity >= product.stock) return;
                setQuantity(quantity + 1);
              }}
            >
              +
            </button>
          </div>

          <div className="mt-4">
            {/* ✅ 按鈕綁定 `handleAddToCart` */}
            <button
              className="btn btn-add-cart"
              onClick={() => handleAddToCart(quantity)}
              disabled={product.stock === 0}
            >
              {product.stock > 0 ? "加入購物車" : "已售完！請等待補貨！"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
