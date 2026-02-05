import React, { useState } from "react";
import Products from "./products"; // must match file path exactly

function App() {
  const [cart, setCart] = useState([]);
  const userId = 1;

  const addItem = (item) => {
    const existing = cart.find((c) => c.product_id === item.product_id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.product_id === item.product_id
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        ),
      );
    } else {
      setCart([...cart, item]);
    }
  };

  const submitOrder = () => {
    if (cart.length === 0) return alert("Cart is empty!");

    fetch("http://localhost:3000/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, items: cart }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(`Order created! ID: ${data.order_id}`);
        setCart([]);
      })
      .catch(console.error);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Order Management</h1>
      <Products onAddItem={addItem} />
      <h2>Cart</h2>
      {cart.length === 0 && <p>Cart is empty</p>}
      {cart.map((item) => (
        <div key={item.product_id}>
          Product {item.product_id} x {item.quantity}
        </div>
      ))}
      <button onClick={submitOrder} style={{ marginTop: "10px" }}>
        Submit Order
      </button>
    </div>
  );
}

export default App;
