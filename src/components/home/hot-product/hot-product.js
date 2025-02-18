"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
export default function HotProduct() {
  const [hotProducts, setHotProducts] = useState([]);

  useEffect(() => {
    const fetchHotProducts = async () => {
      try {
        const response = await fetch("/api/home/hot-product");
        const data = await response.json();
        setHotProducts(data);
      } catch (error) {
        console.error("Error fetching hot products:", error);
      }
    };
    fetchHotProducts();
  }, []);

  return (
    <>
      <section className="d-flex product">
        <h2
          className="title-style text-center"
          data-aos="fade-down"
          data-aos-easing="linear"
          data-aos-duration={700}
        >
          熱門商品
        </h2>
        <article className="product-main">
          {hotProducts.length > 0 ? (
            hotProducts.map((product) => (
              <Link
                href={`/products/${product.id}`}
                data-aos="fade-up"
                data-aos-easing="linear"
                data-aos-duration={700} key={product.id}
              >
                <span className="item">
                  <div className="image">
                    <img src={`/images/products/${product.main_image}`} alt="img" />
                  </div>
                  <h3 className="title">{product.name}</h3>
                  <p className="price">
                    $<span>{product.price}</span>
                  </p>
                </span>
              </Link>
            ))
          ) : (
            <p>目前沒有熱門商品</p>
          )}
        </article>
      </section>
    </>
  );
}
