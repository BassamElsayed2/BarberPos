const express = require("express");
const { getPool, sql } = require("../config/database");
const router = express.Router();

// GET /api/categories - Get all categories
router.get("/", async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT * FROM categories 
      ORDER BY name
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST /api/categories - Add new category
router.post("/", async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({ error: "Name and color are required" });
    }

    const pool = getPool();
    const id = Date.now().toString();

    await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .input("name", sql.NVarChar(100), name)
      .input("description", sql.NVarChar(500), description || null)
      .input("color", sql.NVarChar(20), color).query(`
        INSERT INTO categories (id, name, description, color, created_at, updated_at)
        VALUES (@id, @name, @description, @color, GETDATE(), GETDATE())
      `);

    res.status(201).json({
      id,
      name,
      description,
      color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding category:", error);
    if (
      error.code === "EREQUEST" &&
      error.message.includes("UNIQUE constraint")
    ) {
      res.status(400).json({ error: "Category name already exists" });
    } else {
      res.status(500).json({ error: "Failed to add category" });
    }
  }
});

// PUT /api/categories/:id - Update category
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const pool = getPool();

    await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .input("name", sql.NVarChar(100), name)
      .input("description", sql.NVarChar(500), description)
      .input("color", sql.NVarChar(20), color).query(`
        UPDATE categories 
        SET name = @name,
            description = @description,
            color = @color,
            updated_at = GETDATE()
        WHERE id = @id
      `);

    const result = await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .query("SELECT * FROM categories WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error updating category:", error);
    if (
      error.code === "EREQUEST" &&
      error.message.includes("UNIQUE constraint")
    ) {
      res.status(400).json({ error: "Category name already exists" });
    } else {
      res.status(500).json({ error: "Failed to update category" });
    }
  }
});

// DELETE /api/categories/:id - Delete category
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Check if category is used by products
    const productCheck = await pool
      .request()
      .input("category_id", sql.NVarChar(50), id)
      .query(
        "SELECT COUNT(*) as count FROM products WHERE category_id = @category_id"
      );

    if (productCheck.recordset[0].count > 0) {
      return res.status(400).json({
        error: "Cannot delete category. It is being used by products.",
      });
    }

    await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .query("DELETE FROM categories WHERE id = @id");

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

module.exports = router;
