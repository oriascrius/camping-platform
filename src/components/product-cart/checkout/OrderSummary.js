export default function OrderSummary({
  deliveryMethod,
  subtotal,
  totalAmount,
}) {
  let deliveryCharge;

  if (deliveryMethod === "7-11") {
    deliveryCharge = 60;
  } else if (deliveryMethod === "home_delivery") {
    deliveryCharge = 100;
  }

  return (
    <section className="order-product">
      <div className="container">
        <div className="main">
          <article className="title">
            <h3>訂單資訊</h3>
          </article>
          <article className="content">
            <div className="item-content">
              <div className="subtotal d-flex">
                <p>小計:</p>
                <p>NT${subtotal}</p>
              </div>
              <article className="discount d-flex">
                <p>運費 :</p>
                <p>NT${deliveryCharge}</p>
              </article>
            </div>
          </article>
          <hr />
          <article className="total">
            <p>總計</p>
            <p>NT${totalAmount}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
