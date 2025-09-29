const express = require("express");
const { getPool, sql } = require("../config/database");
const router = express.Router();

// GET /api/sales - Get all sales
router.get("/", async (req, res) => {
  try {
    const pool = getPool();

    // Get all sales
    const salesResult = await pool.request().query(`
      SELECT * FROM sales 
      ORDER BY created_at DESC
    `);

    const sales = salesResult.recordset;
    const salesWithItems = [];

    // Get items for each sale
    for (const sale of sales) {
      const itemsResult = await pool
        .request()
        .input("sale_id", sql.NVarChar(50), sale.id)
        .query("SELECT * FROM sale_items WHERE sale_id = @sale_id");

      salesWithItems.push({
        ...sale,
        items: itemsResult.recordset,
      });
    }

    res.json(salesWithItems);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

// POST /api/sales - Add new sale
router.post("/", async (req, res) => {
  const transaction = getPool().transaction();

  try {
    const {
      invoice_number,
      total_amount,
      employee_id,
      employee_name,
      seller_user,
      items,
    } = req.body;

    if (!invoice_number || !total_amount || !items || items.length === 0) {
      return res.status(400).json({
        error: "Invoice number, total amount, and items are required",
      });
    }

    await transaction.begin();

    const pool = getPool();
    const saleId = Date.now().toString();

    // Insert sale
    await transaction
      .request()
      .input("id", sql.NVarChar(50), saleId)
      .input("invoice_number", sql.NVarChar(50), invoice_number)
      .input("total_amount", sql.Decimal(10, 2), total_amount)
      .input("employee_id", sql.NVarChar(50), employee_id || null)
      .input("employee_name", sql.NVarChar(100), employee_name || null)
      .input("seller_user", sql.NVarChar(100), seller_user || null).query(`
        INSERT INTO sales (id, invoice_number, total_amount, employee_id, employee_name, seller_user, created_at, updated_at)
        VALUES (@id, @invoice_number, @total_amount, @employee_id, @employee_name, @seller_user, GETDATE(), GETDATE())
      `);

    // Insert sale items
    for (const item of items) {
      const itemId = `${saleId}_${item.product_id}`;
      await transaction
        .request()
        .input("id", sql.NVarChar(50), itemId)
        .input("sale_id", sql.NVarChar(50), saleId)
        .input("product_id", sql.NVarChar(50), item.product_id)
        .input("product_name", sql.NVarChar(100), item.product_name)
        .input("quantity", sql.Int, item.quantity)
        .input("unit_price", sql.Decimal(10, 2), item.unit_price)
        .input("total_price", sql.Decimal(10, 2), item.total_price).query(`
          INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, total_price)
          VALUES (@id, @sale_id, @product_id, @product_name, @quantity, @unit_price, @total_price)
        `);
    }

    await transaction.commit();

    res.status(201).json({
      id: saleId,
      invoice_number,
      total_amount,
      employee_id,
      employee_name,
      seller_user,
      items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error adding sale:", error);
    if (
      error.code === "EREQUEST" &&
      error.message.includes("UNIQUE constraint")
    ) {
      res.status(400).json({ error: "Invoice number already exists" });
    } else {
      res.status(500).json({ error: "Failed to add sale" });
    }
  }
});

module.exports = router;
