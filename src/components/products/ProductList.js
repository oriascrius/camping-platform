"use client";
import { ToastContainerComponent } from "@/utils/toast";
import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

export default function ProductList({ products }) {
  return (
    <div className="col-lg-9">
      <div className="row row-cols-1 row-cols-md-3 g-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <ToastContainerComponent />
    </div>
  );
}
