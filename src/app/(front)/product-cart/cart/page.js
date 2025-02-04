"use client";

import Product from "@/components/product-cart/product"
import ProductSilder from "@/components/product-cart/product-silder"
import "@/styles/pages/product-cart/cart/style.css";

export default function Cart() {
  return (
    <>
      <main className="cart-cart">
        <Product />
        <ProductSilder />
      </main>
    </>
  );
}