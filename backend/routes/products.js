const express = require("express");
const { getPool, sql } = require("../config/database");
const router = express.Router();

// GET /api/products - Get all products
router.get("/", async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.name
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/:id - Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const result = await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .query("SELECT * FROM products WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// GET /api/products/barcode/:barcode - Get product by barcode
router.get("/barcode/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;
    const pool = getPool();

    const result = await pool
      .request()
      .input("barcode", sql.NVarChar(50), barcode)
      .query("SELECT * FROM products WHERE barcode = @barcode");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /api/products - Add new product
router.post("/", async (req, res) => {
  try {
    const { name, price, barcode, category_id } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const pool = getPool();
    const id = Date.now().toString();

    await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .input("name", sql.NVarChar(100), name)
      .input("price", sql.Decimal(10, 2), price)
      .input("barcode", sql.NVarChar(50), barcode || null)
      .input("category_id", sql.NVarChar(50), category_id || null).query(`
        INSERT INTO products (id, name, price, barcode, category_id, created_at, updated_at)
        VALUES (@id, @name, @price, @barcode, @category_id, GETDATE(), GETDATE())
      `);

    res.status(201).json({
      id,
      name,
      price,
      barcode,
      category_id,
      stock: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding product:", error);
    if (
      error.code === "EREQUEST" &&
      error.message.includes("UNIQUE constraint")
    ) {
      res.status(400).json({ error: "Barcode already exists" });
    } else {
      res.status(500).json({ error: "Failed to add product" });
    }
  }
});

// PUT /api/products/:id - Update product
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, barcode, category_id } = req.body;

    const pool = getPool();

    await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .input("name", sql.NVarChar(100), name)
      .input("price", sql.Decimal(10, 2), price)
      .input("barcode", sql.NVarChar(50), barcode)
      .input("category_id", sql.NVarChar(50), category_id).query(`
        UPDATE products 
        SET name = @name,
            price = @price,
            barcode = @barcode,
            category_id = @category_id,
            updated_at = GETDATE()
        WHERE id = @id
      `);

    const result = await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .query("SELECT * FROM products WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error updating product:", error);
    if (
      error.code === "EREQUEST" &&
      error.message.includes("UNIQUE constraint")
    ) {
      res.status(400).json({ error: "Barcode already exists" });
    } else {
      res.status(500).json({ error: "Failed to update product" });
    }
  }
});

// DELETE /api/products/:id - Delete product
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Check if product is used in sales
    const saleCheck = await pool
      .request()
      .input("product_id", sql.NVarChar(50), id)
      .query(
        "SELECT COUNT(*) as count FROM sale_items WHERE product_id = @product_id"
      );

    if (saleCheck.recordset[0].count > 0) {
      return res.status(400).json({
        error: "Cannot delete product. It has been used in sales.",
      });
    }

    await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .query("DELETE FROM products WHERE id = @id");

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
