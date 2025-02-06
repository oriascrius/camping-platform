// components/cart/CartItem.js
export default function CartItem({
  name,
  image,
  price,
  quantity,
  subtotal,
  onQuantityChange,
  onDelete,
}) {
  return (
    <div className="item">
      <div className="name-pic item-style">
        <div className="image">
          <img src={image} alt={name} />
        </div>
        <p className="name">{name}</p>
      </div>
      <div className="price item-style">
        <p className="text-center">NT${price}</p>
      </div>
      <div className="quantity item-style d-flex">
        <button onClick={() => onQuantityChange(-1)}>-</button>
        <input
          className="w-100 text-center"
          type="text"
          value={quantity}
          readOnly
        />
        <button onClick={() => onQuantityChange(1)}>+</button>
      </div>
      <div className="subtotal item-style">
        <p className="text-center">NT${subtotal}</p>
      </div>
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
