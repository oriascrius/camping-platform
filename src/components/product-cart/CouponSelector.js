// components/cart/CouponSelector.js
export default function CouponSelector() {
  return (
    <div className="coupon">
      <p>使用的優惠券</p>
      <select>
        <option value={1}>請選擇優惠券</option>
        <option value={2}>優惠券1</option>
        <option value={3}>優惠券2</option>
      </select>
    </div>
  );
}
