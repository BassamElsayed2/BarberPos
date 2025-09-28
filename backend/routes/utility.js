const express = require("express");
const { getPool, sql } = require("../config/database");
const router = express.Router();

// GET /api/utility/export - Export all data to JSON
router.get("/export", async (req, res) => {
  try {
    const pool = getPool();

    // Get all data
    const [categories, products, sales, purchases, employees] =
      await Promise.all([
        pool.request().query("SELECT * FROM categories ORDER BY name"),
        pool.request().query("SELECT * FROM products ORDER BY name"),
        pool.request().query("SELECT * FROM sales ORDER BY created_at DESC"),
        pool
          .request()
          .query("SELECT * FROM purchase_invoices ORDER BY created_at DESC"),
        pool.request().query("SELECT * FROM employees ORDER BY name"),
      ]);

    // Get sale items
    const salesWithItems = [];
    for (const sale of sales.recordset) {
      const itemsResult = await pool
        .request()
        .input("sale_id", sql.NVarChar(50), sale.id)
        .query("SELECT * FROM sale_items WHERE sale_id = @sale_id");

      salesWithItems.push({
        ...sale,
        items: itemsResult.recordset,
      });
    }

    // Get purchase items
    const purchasesWithItems = [];
    for (const purchase of purchases.recordset) {
      const itemsResult = await pool
        .request()
        .input("purchase_id", sql.NVarChar(50), purchase.id)
        .query("SELECT * FROM purchase_items WHERE purchase_id = @purchase_id");

      purchasesWithItems.push({
        ...purchase,
        items: itemsResult.recordset,
      });
    }

    const exportData = {
      categories: categories.recordset,
      products: products.recordset,
      sales: salesWithItems,
      purchaseInvoices: purchasesWithItems,
      employees: employees.recordset,
      exportedAt: new Date().toISOString(),
    };

    res.json(exportData);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// POST /api/utility/import - Import data from JSON
router.post("/import", async (req, res) => {
  const transaction = getPool().transaction();

  try {
    const { categories, products, sales, purchaseInvoices, employees } =
      req.body;

    await transaction.begin();
    const pool = getPool();

    // Clear existing data (in reverse order due to foreign keys)
    await transaction.request().query("DELETE FROM sale_items");
    await transaction.request().query("DELETE FROM sales");
    await transaction.request().query("DELETE FROM purchase_items");
    await transaction.request().query("DELETE FROM purchase_invoices");
    await transaction.request().query("DELETE FROM employees");
    await transaction.request().query("DELETE FROM products");
    await transaction.request().query("DELETE FROM categories");

    // Insert categories
    if (categories && categories.length > 0) {
      for (const category of categories) {
        await transaction
          .request()
          .input("id", sql.NVarChar(50), category.id)
          .input("name", sql.NVarChar(100), category.name)
          .input("description", sql.NVarChar(500), category.description)
          .input("color", sql.NVarChar(20), category.color)
          .input("created_at", sql.DateTime2, category.created_at)
          .input("updated_at", sql.DateTime2, category.updated_at).query(`
            INSERT INTO categories (id, name, description, color, created_at, updated_at)
            VALUES (@id, @name, @description, @color, @created_at, @updated_at)
          `);
      }
    }

    // Insert products
    if (products && products.length > 0) {
      for (const product of products) {
        await transaction
          .request()
          .input("id", sql.NVarChar(50), product.id)
          .input("name", sql.NVarChar(100), product.name)
          .input("price", sql.Decimal(10, 2), product.price)
          .input("barcode", sql.NVarChar(50), product.barcode)
          .input("category_id", sql.NVarChar(50), product.category_id)
          .input("stock", sql.Int, product.stock || 0)
          .input("created_at", sql.DateTime2, product.created_at)
          .input("updated_at", sql.DateTime2, product.updated_at).query(`
            INSERT INTO products (id, name, price, barcode, category_id, stock, created_at, updated_at)
            VALUES (@id, @name, @price, @barcode, @category_id, @stock, @created_at, @updated_at)
          `);
      }
    }

    // Insert employees
    if (employees && employees.length > 0) {
      for (const employee of employees) {
        await transaction
          .request()
          .input("id", sql.NVarChar(50), employee.id)
          .input("name", sql.NVarChar(100), employee.name)
          .input("phone", sql.NVarChar(20), employee.phone)
          .input("salary", sql.Decimal(10, 2), employee.salary)
          .input("commission", sql.Decimal(5, 2), employee.commission)
          .input("created_at", sql.DateTime2, employee.created_at)
          .input("updated_at", sql.DateTime2, employee.updated_at).query(`
            INSERT INTO employees (id, name, phone, salary, commission, created_at, updated_at)
            VALUES (@id, @name, @phone, @salary, @commission, @created_at, @updated_at)
          `);
      }
    }

    // Insert sales
    if (sales && sales.length > 0) {
      for (const sale of sales) {
        await transaction
          .request()
          .input("id", sql.NVarChar(50), sale.id)
          .input("invoice_number", sql.NVarChar(50), sale.invoice_number)
          .input("total_amount", sql.Decimal(10, 2), sale.total_amount)
          .input("employee_id", sql.NVarChar(50), sale.employee_id)
          .input("employee_name", sql.NVarChar(100), sale.employee_name)
          .input("seller_user", sql.NVarChar(100), sale.seller_user)
          .input("created_at", sql.DateTime2, sale.created_at)
          .input("updated_at", sql.DateTime2, sale.updated_at).query(`
            INSERT INTO sales (id, invoice_number, total_amount, employee_id, employee_name, seller_user, created_at, updated_at)
            VALUES (@id, @invoice_number, @total_amount, @employee_id, @employee_name, @seller_user, @created_at, @updated_at)
          `);

        // Insert sale items
        if (sale.items && sale.items.length > 0) {
          for (const item of sale.items) {
            await transaction
              .request()
              .input("id", sql.NVarChar(50), item.id)
              .input("sale_id", sql.NVarChar(50), item.sale_id)
              .input("product_id", sql.NVarChar(50), item.product_id)
              .input("product_name", sql.NVarChar(100), item.product_name)
              .input("quantity", sql.Int, item.quantity)
              .input("unit_price", sql.Decimal(10, 2), item.unit_price)
              .input("total_price", sql.Decimal(10, 2), item.total_price)
              .query(`
                INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, total_price)
                VALUES (@id, @sale_id, @product_id, @product_name, @quantity, @unit_price, @total_price)
              `);
          }
        }
      }
    }

    // Insert purchase invoices
    if (purchaseInvoices && purchaseInvoices.length > 0) {
      for (const purchase of purchaseInvoices) {
        await transaction
          .request()
          .input("id", sql.NVarChar(50), purchase.id)
          .input("invoice_number", sql.NVarChar(50), purchase.invoice_number)
          .input("supplier_name", sql.NVarChar(100), purchase.supplier_name)
          .input("total_amount", sql.Decimal(10, 2), purchase.total_amount)
          .input("created_at", sql.DateTime2, purchase.created_at)
          .input("updated_at", sql.DateTime2, purchase.updated_at).query(`
            INSERT INTO purchase_invoices (id, invoice_number, supplier_name, total_amount, created_at, updated_at)
            VALUES (@id, @invoice_number, @supplier_name, @total_amount, @created_at, @updated_at)
          `);

        // Insert purchase items
        if (purchase.items && purchase.items.length > 0) {
          for (const item of purchase.items) {
            await transaction
              .request()
              .input("id", sql.NVarChar(50), item.id)
              .input("purchase_id", sql.NVarChar(50), item.purchase_id)
              .input("product_id", sql.NVarChar(50), item.product_id)
              .input("product_name", sql.NVarChar(100), item.product_name)
              .input("quantity", sql.Int, item.quantity)
              .input("unit_price", sql.Decimal(10, 2), item.unit_price)
              .input("total_price", sql.Decimal(10, 2), item.total_price)
              .query(`
                INSERT INTO purchase_items (id, purchase_id, product_id, product_name, quantity, unit_price, total_price)
                VALUES (@id, @purchase_id, @product_id, @product_name, @quantity, @unit_price, @total_price)
              `);
          }
        }
      }
    }

    await transaction.commit();
    res.json({ message: "Data imported successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error importing data:", error);
    res.status(500).json({ error: "Failed to import data" });
  }
});

// POST /api/utility/clear - Clear all data
router.post("/clear", async (req, res) => {
  const transaction = getPool().transaction();

  try {
    await transaction.begin();

    // Clear all data (in reverse order due to foreign keys)
    await transaction.request().query("DELETE FROM sale_items");
    await transaction.request().query("DELETE FROM sales");
    await transaction.request().query("DELETE FROM purchase_items");
    await transaction.request().query("DELETE FROM purchase_invoices");
    await transaction.request().query("DELETE FROM employees");
    await transaction.request().query("DELETE FROM products");
    await transaction.request().query("DELETE FROM categories");

    await transaction.commit();
    res.json({ message: "Database cleared successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error clearing database:", error);
    res.status(500).json({ error: "Failed to clear database" });
  }
});

module.exports = router;
