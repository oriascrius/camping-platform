// app/product-cart/review/[orderId]/page.js
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import StarRating from "../../components/star-rating";
import Swal from "sweetalert2";

export default function OrderReview() {
  const { orderId } = useParams();
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 取得可評論商品
  const fetchReviewableProducts = async () => {
    try {
      const { data } = await axios.get(
        `/api/member/orders/${orderId}/products`
      );
      setProducts(data.filter((p) => p.has_rated === 0)); // 只顯示未評論商品
    } catch (error) {
      Swal.fire("錯誤", error.response?.data?.error || "取得商品失敗", "error");
    }
  };

  // 提交評論
  const handleSubmit = async (productId) => {
    try {
      setIsSubmitting(true);

      const reviewData = reviews[productId];
      if (!reviewData?.rating || reviewData.rating < 1) {
        throw new Error("請至少給予1星評分");
      }

      await axios.post(`/api/member/reviews`, {
        order_id: orderId,
        product_id: productId,
        rating: reviewData.rating,
        content: reviewData.content || "",
      });

      // 更新本地狀態
      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      Swal.fire("成功", "評論已提交", "success");
    } catch (error) {
      Swal.fire("失敗", error.response?.data?.error || error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchReviewableProducts();
  }, [orderId]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">訂單 #{orderId} 商品評論</h1>

      {products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">此訂單無可評論商品或已全部評論完成</p>
        </div>
      ) : (
        products.map((product) => (
          <div
            key={product.product_id}
            className="bg-white rounded-lg shadow-md p-6 mb-4"
          >
            <div className="flex gap-4">
              <img
                src={
                  product.main_image
                    ? `/images/products/${product.main_image}`
                    : "/default-product.jpg"
                }
                alt={product.name}
                className="w-32 h-32 object-cover rounded"
              />

              <div className="flex-1">
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <p className="text-gray-600 mb-2">
                  購買數量: {product.quantity}
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    商品評分
                  </label>
                  <StarRating
                    rating={reviews[product.product_id]?.rating || 0}
                    onRate={(rating) =>
                      setReviews((prev) => ({
                        ...prev,
                        [product.product_id]: {
                          ...prev[product.product_id],
                          rating,
                        },
                      }))
                    }
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    評論內容
                  </label>
                  <textarea
                    value={reviews[product.product_id]?.content || ""}
                    onChange={(e) =>
                      setReviews((prev) => ({
                        ...prev,
                        [product.product_id]: {
                          ...prev[product.product_id],
                          content: e.target.value,
                        },
                      }))
                    }
                    placeholder="請輸入您的使用心得..."
                    className="w-full p-2 border rounded"
                    rows="3"
                    maxLength="500"
                  />
                  <div className="text-sm text-gray-500 text-right">
                    {reviews[product.product_id]?.content?.length || 0}/500
                  </div>
                </div>

                <button
                  onClick={() => handleSubmit(product.product_id)}
                  disabled={isSubmitting}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSubmitting ? "提交中..." : "提交評論"}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
