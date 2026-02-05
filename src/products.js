import React, { useEffect, useState } from "react";
import axios from "axios";

const Products = ({ onAddItem }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3000/products")
      .then((res) => {
        // Convert price to number for each product
        const formattedProducts = res.data.map((p) => ({
          ...p,
          price: Number(p.price),
        }));
        setProducts(formattedProducts);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Products</h2>
      {products.length === 0 ? (
        <p>Loading products...</p>
      ) : (
        products.map((product) => (
          <div key={product.id} style={{ marginBottom: "10px" }}>
            {product.name} - ${product.price.toFixed(2)}
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => onAddItem({ product_id: product.id, quantity: 1 })}
            >
              Add
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default Products;
