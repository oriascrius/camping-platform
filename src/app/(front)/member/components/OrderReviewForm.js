"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StarRating from "./star-rating";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

export default function OrderReviewForm({ orderId }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orderProducts, setOrderProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  // 添加一個 ref 來追蹤 Swal 是否已顯示過
  const swalShown = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
        confirmButtonColor: "#5b4034",
      });
      router.push("/auth/login");
      return;
    }

    // 根據訂單ID獲取商品
    const fetchOrderProducts = async () => {
      try {
        const response = await axios.get(
          `/api/member/orders/${session.user.id}`
        );
        const order = response.data.find(
          (o) => o.order_id.toString() === orderId
        );

        if (!order) {
          Swal.fire({
            icon: "error",
            title: "找不到訂單",
            text: "無法載入訂單資料",
          });
          router.push("/member/purchase-history");
          return;
        }

        if (!order.products || order.products.length === 0) {
          setLoading(false);
          return;
        }

        const productIds = order.products.map((p) => p.product_id).join(",");
        console.log("訂單商品IDs:", productIds);

        try {
          // 檢查已評論和未評論的商品
          const reviewResponse = await axios.get(
            `/api/member/reviews/check/${session.user.id}?orderId=${orderId}&productIds=${productIds}`
          );

          console.log("評論檢查回應:", reviewResponse.data);

          const unreviewedProductIds =
            reviewResponse.data.unreviewedProductIds || [];
          const reviewedProductIds =
            reviewResponse.data.reviewedProductIds || [];

          if (
            reviewedProductIds.length > 0 &&
            unreviewedProductIds.length === 0 &&
            !swalShown.current // 確認 Swal 尚未顯示
          ) {
            swalShown.current = true; // 標記已經顯示

            Swal.fire({
              icon: "info",
              title: "已完成評論",
              text: "您已經評論過此訂單的所有商品",
              confirmButtonColor: "#5b4034",
            }).then(() => {
              router.push("/member/reviews");
            });
            return;
          }

          if (
            reviewedProductIds.length > 0 &&
            unreviewedProductIds.length > 0 &&
            !swalShown.current // 確認 Swal 尚未顯示
          ) {
            swalShown.current = true; // 標記已經顯示

            // 顯示提示：部分產品已評論
            Swal.fire({
              icon: "info",
              title: "部分商品已評論",
              text: "只顯示您尚未評論過的商品",
              confirmButtonColor: "#5B4034",
            });
          }

          // 篩選未評論的商品
          const unreviewedProducts = order.products.filter((product) =>
            unreviewedProductIds.includes(product.product_id.toString())
          );

          setOrderProducts(unreviewedProducts);

          // 初始化評論狀態
          const initialReviews = unreviewedProducts.map((product) => ({
            product_id: product.product_id,
            rating: 5,
            content: "",
            product_name: product.name,
            product_image: product.image,
          }));

          setReviews(initialReviews);
        } catch (reviewError) {
          console.error("檢查評論狀態失敗:", reviewError);
          // 如果評論檢查失敗，顯示所有商品
          setOrderProducts(order.products);

          const initialReviews = order.products.map((product) => ({
            product_id: product.product_id,
            rating: 5,
            content: "",
            product_name: product.name,
            product_image: product.image,
          }));

          setReviews(initialReviews);
        }

        setLoading(false);
      } catch (error) {
        console.error("獲取訂單商品失敗:", error);
        setLoading(false);
      }
    };

    fetchOrderProducts();
  }, [session, status, orderId, router]);

  const handleRatingChange = (productId, newRating) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.product_id === productId
          ? { ...review, rating: newRating }
          : review
      )
    );
  };

  const handleContentChange = (productId, newContent) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.product_id === productId
          ? { ...review, content: newContent }
          : review
      )
    );
  };

  const handleSubmitReviews = async () => {
    try {
      const reviewsToSubmit = reviews.filter(
        (review) => review.content.trim() !== ""
      );

      if (reviewsToSubmit.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "請填寫評論內容",
          text: "至少需要填寫一項商品評論",
          confirmButtonColor: "#5b4034",
        });
        return;
      }

      // 提交所有評論
      await axios.post(`/api/member/reviews/batch/${session.user.id}`, {
        reviews: reviewsToSubmit.map((review) => ({
          itemId: review.product_id,
          type: "product",
          rating: review.rating,
          content: review.content,
          orderId: orderId, // 把訂單ID添加到每個評論
        })),
      });

      Swal.fire({
        icon: "success",
        title: "評論提交成功",
        text: "感謝您的評價!",
        confirmButtonColor: "#5B4034",
      }).then(() => {
        router.push("/member/reviews");
      });
    } catch (error) {
      console.error("提交評論失敗:", error);
      Swal.fire({
        icon: "error",
        title: "評論提交失敗",
        text: error.response?.data?.message || "請稍後再試",
        confirmButtonColor: "#9B7A5A",
      });
    }
  };

  return (
    <div className="order-review-form">
      <h1>商品評價</h1>
      <p className="text-muted mb-4">訂單編號: #{orderId}</p>

      <AnimatePresence>
        {loading ? (
          Array(3)
            .fill()
            .map((_, index) => (
              <motion.div
                key={index}
                className="llm-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            ))
        ) : (
          <div className="product-review-list">
            {reviews.length === 0 ? (
              <div className="no-data">
                <p>此訂單沒有可評價的商品</p>
              </div>
            ) : (
              reviews.map((review, index) => (
                <motion.div
                  className="review-form-item"
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="review-product-info">
                    {review.product_image ? (
                      <img
                        src={`/images/products/${review.product_image}`}
                        alt={review.product_name}
                        style={{
                          borderRadius: "8px",
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <img
                        src="/images/products/default.png"
                        alt="預設圖片"
                        style={{
                          borderRadius: "8px",
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <h4 className="ms-3">{review.product_name}</h4>
                  </div>

                  <div className="review-form-content mt-3">
                    <div className="rating-container">
                      <h5>評分:</h5>
                      <StarRating
                        initialRating={review.rating}
                        onRatingChange={(newRating) =>
                          handleRatingChange(review.product_id, newRating)
                        }
                        size={30}
                      />
                    </div>

                    <div className="mt-3">
                      <h5>評論內容:</h5>
                      <textarea
                        value={review.content}
                        onChange={(e) =>
                          handleContentChange(review.product_id, e.target.value)
                        }
                        placeholder="請分享您對這個商品的看法..."
                        className="form-control"
                        rows={4}
                      />
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            <div className="submit-container mt-4 d-flex justify-content-between">
              <button
                className="btn btn-secondary"
                onClick={() => router.push("/member/purchase-history")}
              >
                返回訂單
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitReviews}
                disabled={reviews.length === 0}
              >
                提交所有評論
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
