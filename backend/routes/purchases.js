const express = require("express");
const { getPool, sql } = require("../config/database");
const router = express.Router();

// GET /api/purchases - Get all purchase invoices
router.get("/", async (req, res) => {
  try {
    const pool = getPool();

    // Get all purchase invoices
    const purchasesResult = await pool.request().query(`
      SELECT * FROM purchase_invoices 
      ORDER BY created_at DESC
    `);

    const purchases = purchasesResult.recordset;
    const purchasesWithItems = [];

    // Get items for each purchase
    for (const purchase of purchases) {
      const itemsResult = await pool
        .request()
        .input("purchase_id", sql.NVarChar(50), purchase.id)
        .query("SELECT * FROM purchase_items WHERE purchase_id = @purchase_id");

      purchasesWithItems.push({
        ...purchase,
        items: itemsResult.recordset,
      });
    }

    res.json(purchasesWithItems);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

// POST /api/purchases - Add new purchase invoice
router.post("/", async (req, res) => {
  const transaction = getPool().transaction();

  try {
    const { invoice_number, supplier_name, total_amount, items } = req.body;

    if (
      !invoice_number ||
      !supplier_name ||
      !total_amount ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        error:
          "Invoice number, supplier name, total amount, and items are required",
      });
    }

    await transaction.begin();

    const pool = getPool();
    const purchaseId = Date.now().toString();

    // Insert purchase invoice
    await transaction
      .request()
      .input("id", sql.NVarChar(50), purchaseId)
      .input("invoice_number", sql.NVarChar(50), invoice_number)
      .input("supplier_name", sql.NVarChar(100), supplier_name)
      .input("total_amount", sql.Decimal(10, 2), total_amount).query(`
        INSERT INTO purchase_invoices (id, invoice_number, supplier_name, total_amount, created_at, updated_at)
        VALUES (@id, @invoice_number, @supplier_name, @total_amount, GETDATE(), GETDATE())
      `);

    // Insert purchase items
    for (const item of items) {
      const itemId = `${purchaseId}_${item.product_id}`;
      await transaction
        .request()
        .input("id", sql.NVarChar(50), itemId)
        .input("purchase_id", sql.NVarChar(50), purchaseId)
        .input("product_id", sql.NVarChar(50), item.product_id)
        .input("product_name", sql.NVarChar(100), item.product_name)
        .input("quantity", sql.Int, item.quantity)
        .input("unit_price", sql.Decimal(10, 2), item.unit_price)
        .input("total_price", sql.Decimal(10, 2), item.total_price).query(`
          INSERT INTO purchase_items (id, purchase_id, product_id, product_name, quantity, unit_price, total_price)
          VALUES (@id, @purchase_id, @product_id, @product_name, @quantity, @unit_price, @total_price)
        `);
    }

    await transaction.commit();

    res.status(201).json({
      id: purchaseId,
      invoice_number,
      supplier_name,
      total_amount,
      items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error adding purchase:", error);
    if (
      error.code === "EREQUEST" &&
      error.message.includes("UNIQUE constraint")
    ) {
      res.status(400).json({ error: "Invoice number already exists" });
    } else {
      res.status(500).json({ error: "Failed to add purchase" });
    }
  }
});

module.exports = router;
