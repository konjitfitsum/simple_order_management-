import express from "express";
import db from "./db.js";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// =========================
// Products routes
// =========================

// Get all products
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).send("Error fetching products");
    }
    res.json(results);
  });
});

// Add a new product (Admin)
app.post("/products", (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Missing fields" });
  }

  db.query(
    "INSERT INTO products (name, price) VALUES (?, ?)",
    [name, price],
    (err, result) => {
      if (err) {
        console.error("Error adding product:", err);
        return res.status(500).json(err);
      }
      res.json({ id: result.insertId, name, price });
    },
  );
});

// =========================
// Orders route
// =========================

app.post("/orders", (req, res) => {
  const { user_id, items } = req.body;

  if (!user_id || !items || items.length === 0) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  // Start a transaction
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: "Transaction failed to start" });
    }

    // Step 1: Get products from DB to calculate total
    const productIds = items.map((item) => item.product_id);
    db.query(
      `SELECT id, price FROM products WHERE id IN (?)`,
      [productIds],
      (err, results) => {
        if (err) {
          return db.rollback(() =>
            res.status(500).json({ error: "Failed to fetch products" }),
          );
        }

        // Calculate total
        let total = 0;
        for (let item of items) {
          const product = results.find((p) => p.id === item.product_id);
          if (!product) {
            return db.rollback(() =>
              res
                .status(400)
                .json({ error: `Product ${item.product_id} not found` }),
            );
          }
          total += product.price * item.quantity;
        }

        // Step 2: Insert into orders
        db.query(
          `INSERT INTO orders (user_id, total) VALUES (?, ?)`,
          [user_id, total],
          (err, result) => {
            if (err) {
              return db.rollback(() =>
                res.status(500).json({ error: "Failed to create order" }),
              );
            }

            const orderId = result.insertId;

            // Step 3: Insert order items
            const orderItems = items.map((item) => [
              orderId,
              item.product_id,
              item.quantity,
            ]);
            db.query(
              `INSERT INTO order_items (order_id, product_id, quantity) VALUES ?`,
              [orderItems],
              (err) => {
                if (err) {
                  return db.rollback(() =>
                    res
                      .status(500)
                      .json({ error: "Failed to add order items" }),
                  );
                }

                // Commit transaction
                db.commit((err) => {
                  if (err) {
                    return db.rollback(() =>
                      res
                        .status(500)
                        .json({ error: "Failed to commit transaction" }),
                    );
                  }

                  res.json({
                    message: "Order created successfully",
                    order_id: orderId,
                  });
                });
              },
            );
          },
        );
      },
    );
  });
});

// =========================
// Connect to MySQL and start server
// =========================

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: ", err);
    return;
  }
  console.log("Connected to MySQL!");
  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
});
