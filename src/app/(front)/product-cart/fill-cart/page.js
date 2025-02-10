import Link from "next/link";
import OrderSteps from "@/components/product-cart/checkout/OrderSteps";
import CartProducts from "@/components/product-cart/checkout/CartProducts";
import DeliveryOptions from "@/components/product-cart/checkout/DeliveryOptions";
import PaymentOptions from "@/components/product-cart/checkout/PaymentOptions";
import OrderSummary from "@/components/product-cart/checkout/OrderSummary";
import CustomerInfoForm from "@/components/product-cart/checkout/CustomerInfoForm";

import "@/styles/pages/product-cart/fill-cart/style.css";

export default function FillCart() {
  return (
    <main className="fill-cart">
      {/* Step Navigation */}
      <OrderSteps />

      {/* Cart Products Section */}
      <CartProducts />

      {/* Delivery Options Section */}
      <DeliveryOptions />

      {/* Payment Options Section */}
      <PaymentOptions />

      {/* Order Summary Section */}
      <OrderSummary />

      {/* Customer Information Form */}
      <CustomerInfoForm />

      {/* Submit Button */}
      <button className="submit">
        <Link href="/product-cart/order-confirmation">送出訂單</Link>
      </button>
    </main>
  );
}
