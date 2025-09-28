const express = require("express");
const { getPool, sql } = require("../config/database");
const router = express.Router();

// GET /api/employees - Get all employees
router.get("/", async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT * FROM employees 
      ORDER BY name
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// POST /api/employees - Add new employee
router.post("/", async (req, res) => {
  try {
    const { name, phone, salary, commission } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    const pool = getPool();
    const id = Date.now().toString();

    await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .input("name", sql.NVarChar(100), name)
      .input("phone", sql.NVarChar(20), phone)
      .input("salary", sql.Decimal(10, 2), salary || 0)
      .input("commission", sql.Decimal(5, 2), commission || 0).query(`
        INSERT INTO employees (id, name, phone, salary, commission, created_at, updated_at)
        VALUES (@id, @name, @phone, @salary, @commission, GETDATE(), GETDATE())
      `);

    res.status(201).json({
      id,
      name,
      phone,
      salary: salary || 0,
      commission: commission || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding employee:", error);
    if (
      error.code === "EREQUEST" &&
      error.message.includes("UNIQUE constraint")
    ) {
      res.status(400).json({ error: "Phone number already exists" });
    } else {
      res.status(500).json({ error: "Failed to add employee" });
    }
  }
});

// PUT /api/employees/:id - Update employee
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, salary, commission } = req.body;

    const pool = getPool();

    await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .input("name", sql.NVarChar(100), name)
      .input("phone", sql.NVarChar(20), phone)
      .input("salary", sql.Decimal(10, 2), salary)
      .input("commission", sql.Decimal(5, 2), commission).query(`
        UPDATE employees 
        SET name = @name,
            phone = @phone,
            salary = @salary,
            commission = @commission,
            updated_at = GETDATE()
        WHERE id = @id
      `);

    const result = await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .query("SELECT * FROM employees WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error updating employee:", error);
    if (
      error.code === "EREQUEST" &&
      error.message.includes("UNIQUE constraint")
    ) {
      res.status(400).json({ error: "Phone number already exists" });
    } else {
      res.status(500).json({ error: "Failed to update employee" });
    }
  }
});

// DELETE /api/employees/:id - Delete employee
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Check if employee is used in sales
    const saleCheck = await pool
      .request()
      .input("employee_id", sql.NVarChar(50), id)
      .query(
        "SELECT COUNT(*) as count FROM sales WHERE employee_id = @employee_id"
      );

    if (saleCheck.recordset[0].count > 0) {
      return res.status(400).json({
        error: "Cannot delete employee. They have sales records.",
      });
    }

    await pool
      .request()
      .input("id", sql.NVarChar(50), id)
      .query("DELETE FROM employees WHERE id = @id");

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

module.exports = router;
