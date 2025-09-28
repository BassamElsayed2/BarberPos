const express = require("express");
const { getPool, sql } = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const router = express.Router();

// Create users table if it doesn't exist
router.post("/setup", async (req, res) => {
  try {
    const pool = getPool();

    // Create users table
    const createUsersTableSQL = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      BEGIN
          CREATE TABLE users (
              id NVARCHAR(50) PRIMARY KEY,
              username NVARCHAR(50) NOT NULL UNIQUE,
              email NVARCHAR(100) NOT NULL UNIQUE,
              password NVARCHAR(255) NOT NULL,
              role NVARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee', 'manager')),
              created_at DATETIME2 DEFAULT GETDATE(),
              updated_at DATETIME2 DEFAULT GETDATE()
          );
      END
    `;

    await pool.request().query(createUsersTableSQL);

    // Insert default admin user if not exists
    const checkAdminSQL =
      "SELECT COUNT(*) as count FROM users WHERE username = 'admin'";
    const adminResult = await pool.request().query(checkAdminSQL);

    if (adminResult.recordset[0].count === 0) {
      // Hash the default admin password
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const insertAdminSQL = `
        INSERT INTO users (id, username, email, password, role)
        VALUES (
          'admin_001',
          'admin',
          'admin@barber.com',
          @password,
          'admin'
        )
      `;

      await pool
        .request()
        .input("password", hashedPassword)
        .query(insertAdminSQL);
    }

    res.json({ message: "Users table created successfully" });
  } catch (error) {
    console.error("Error creating users table:", error);
    res.status(500).json({ error: "Failed to create users table" });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT id, username, email, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const result = await pool.request().input("id", id).query(`
        SELECT id, username, email, role, created_at, updated_at 
        FROM users 
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Create new user
router.post("/", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        error: "Missing required fields: username, email, password, role",
      });
    }

    // Validate role
    if (!["admin", "employee", "manager"].includes(role)) {
      return res.status(400).json({
        error: "Invalid role. Must be admin, employee, or manager",
      });
    }

    const pool = getPool();
    const userId = uuidv4();

    // Check if username or email already exists
    const existingUser = await pool
      .request()
      .input("username", username)
      .input("email", email).query(`
        SELECT id FROM users 
        WHERE username = @username OR email = @email
      `);

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({
        error: "Username or email already exists",
      });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await pool
      .request()
      .input("id", userId)
      .input("username", username)
      .input("email", email)
      .input("password", hashedPassword)
      .input("role", role).query(`
        INSERT INTO users (id, username, email, password, role)
        VALUES (@id, @username, @email, @password, @role)
      `);

    // Return user without password
    const newUser = await pool.request().input("id", userId).query(`
        SELECT id, username, email, role, created_at, updated_at 
        FROM users 
        WHERE id = @id
      `);

    res.status(201).json(newUser.recordset[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    const pool = getPool();

    // Check if user exists
    const existingUser = await pool
      .request()
      .input("id", id)
      .query("SELECT id FROM users WHERE id = @id");

    if (existingUser.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate role if provided
    if (role && !["admin", "employee", "manager"].includes(role)) {
      return res.status(400).json({
        error: "Invalid role. Must be admin, employee, or manager",
      });
    }

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const duplicateCheck = await pool
        .request()
        .input("id", id)
        .input("username", username || "")
        .input("email", email || "").query(`
          SELECT id FROM users 
          WHERE id != @id AND (username = @username OR email = @email)
        `);

      if (duplicateCheck.recordset.length > 0) {
        return res.status(409).json({
          error: "Username or email already exists",
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const inputs = { id };

    if (username) {
      updateFields.push("username = @username");
      inputs.username = username;
    }
    if (email) {
      updateFields.push("email = @email");
      inputs.email = email;
    }
    if (password) {
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = @password");
      inputs.password = hashedPassword;
    }
    if (role) {
      updateFields.push("role = @role");
      inputs.role = role;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateFields.push("updated_at = GETDATE()");

    const request = pool.request();
    Object.keys(inputs).forEach((key) => {
      request.input(key, inputs[key]);
    });

    await request.query(`
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = @id
    `);

    // Return updated user
    const updatedUser = await pool.request().input("id", id).query(`
        SELECT id, username, email, role, created_at, updated_at 
        FROM users 
        WHERE id = @id
      `);

    res.json(updatedUser.recordset[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Check if user exists
    const existingUser = await pool
      .request()
      .input("id", id)
      .query("SELECT id FROM users WHERE id = @id");

    if (existingUser.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user
    await pool
      .request()
      .input("id", id)
      .query("DELETE FROM users WHERE id = @id");

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Authenticate user (login)
router.post("/authenticate", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    const pool = getPool();

    // First, get the user by username
    const result = await pool.request().input("username", username).query(`
        SELECT id, username, email, password, role, created_at, updated_at 
        FROM users 
        WHERE username = @username
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.recordset[0];

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error authenticating user:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

module.exports = router;
