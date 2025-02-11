import Link from "next/link";
// components/cart/CartItem.js
export default function CartItem({
  product_id,
  product_name, // ✅ 改對應 API 回傳的 `product_name`
  product_image, // ✅ 改對應 API 回傳的 `product_image`
  product_price, // ✅ 改對應 API 回傳的 `product_price`
  quantity,
  onQuantityChange,
  onDelete,
}) {
  // ✅ 計算小計 (商品價格 * 數量)
  const subtotal = product_price * quantity;

  function dOrD(quantity) {
    if (quantity > 1) {
      return onQuantityChange(-1);
    }
    return onDelete();
  }

  return (
    <div className="item mb-3">
      {/* 商品圖片 */}
      <div className="name-pic item-style">
        <div className="image">
          <img src={`/images/products/${product_image}`} alt={product_name} />
        </div>
        <Link href={`/products/${product_id}`}>
          <p className="name">{product_name}</p>
        </Link>
      </div>

      {/* 單價 */}
      <div className="price item-style">
        <p className="text-center">NT${product_price}</p>
      </div>

      {/* 數量增減按鈕 */}
      <div className="quantity item-style d-flex">
        <button onClick={() => dOrD(quantity)}>-</button>
        <input
          className="w-100 text-center"
          type="text"
          value={quantity}
          readOnly
        />
        <button onClick={() => onQuantityChange(1)}>+</button>
      </div>

      {/* 小計 */}
      <div className="subtotal item-style">
        <p className="text-center">NT${subtotal}</p>
      </div>

      {/* 刪除按鈕 */}
      <div className="delete item-style">
        <button onClick={onDelete}>
          <img
            width={26}
            height={26}
            src="/images/product-cart/delete-icon.png"
            alt="刪除商品"
          />
        </button>
      </div>
    </div>
  );
}
