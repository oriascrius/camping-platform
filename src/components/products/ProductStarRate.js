"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import UserCommentComponent from "./UserComment";

export default function ProductStarRateComponent() {
  const { productId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // ✅ 提交評論後，將新評論加到評論列表最上方並重新計算平均評分
  const onReviewSubmitted = (newReview) => {
    setReviews((prevReviews) => {
      const updatedReviews = [
        {
          id: newReview.review_id || `temp-${Date.now()}`,
          user_id: newReview.user_id,
          user_name: newReview.user_name,
          content: newReview.content,
          rating: newReview.rating,
          created_at: newReview.created_at || new Date().toISOString(),
        },
        ...prevReviews,
      ];

      // ✅ 重新計算平均評分
      const totalRatings = updatedReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const newAvgRating = totalRatings / updatedReviews.length;

      setAvgRating(newAvgRating);
      setTotalReviews(updatedReviews.length);

      return updatedReviews;
    });
  };

  useEffect(() => {
    fetch(`/api/products/productRate/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReviews(data.reviews);
          setAvgRating(Number(data.avg_rating) || 0);
          setTotalReviews(data.total_reviews);
        }
      })
      .catch((error) => console.error("獲取評論失敗:", error));
  }, [productId]);

  return (
    <div className="container my-p-review-container ">
      <section className="review-header">
        <h3>商品評論</h3>
        {totalReviews == 0 ? (
          <p>目前沒有任何評論</p>
        ) : (
          <p className="review-summary mt-3">
            <strong>平均評分:</strong> {avgRating.toFixed(1)} / 5 ⭐ (
            {totalReviews} 則評論)
          </p>
        )}
      </section>

      <ul className="review-list">
        {reviews.map((review, index) => (
          <li key={review.id || `review-${index}`} className="review-item">
            <div className="review-user">
              <strong className="review-username">{review.user_name}</strong>
              <span className="review-stars">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </span>
            </div>
            <p className="review-content">{review.content}</p>
            <p className="review-date">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>

      <UserCommentComponent
        productId={productId}
        onReviewSubmitted={onReviewSubmitted}
      />
    </div>
  );
}
