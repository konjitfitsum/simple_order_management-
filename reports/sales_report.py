import mysql.connector
import csv
from datetime import date
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()


db = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_DATABASE"),
    port=int(os.getenv("DB_PORT"))
)

cursor = db.cursor(dictionary=True)

query = """
SELECT
  o.id AS order_id,
  o.created_at,
  p.name AS product_name,
  oi.quantity,
  p.price,
  (oi.quantity * p.price) AS total
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
ORDER BY o.created_at DESC
"""

cursor.execute(query)
rows = cursor.fetchall()

filename = f"sales_report_{date.today()}.csv"

with open(filename, "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow([
        "Order ID",
        "Date",
        "Product",
        "Quantity",
        "Price",
        "Total"
    ])

    for row in rows:
        writer.writerow([
            row["order_id"],
            row["created_at"],
            row["product_name"],
            row["quantity"],
            row["price"],
            row["total"]
        ])

print(f"Report generated: {filename}")
