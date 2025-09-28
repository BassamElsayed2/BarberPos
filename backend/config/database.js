const sql = require("mssql");
require("dotenv").config({ path: "./config.env" });

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },
};

// Create connection pool
let pool;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log("✅ Connected to SQL Server");

      // Create tables if they don't exist
      await createTables();
    }
    return pool;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

const createTables = async () => {
  try {
    const createTablesSQL = `
      -- Categories table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categories' AND xtype='U')
      CREATE TABLE categories (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500),
        color NVARCHAR(20) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      );

      -- Products table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='products' AND xtype='U')
      CREATE TABLE products (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        barcode NVARCHAR(50) UNIQUE,
        category_id NVARCHAR(50),
        stock INT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      -- Employees table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='employees' AND xtype='U')
      CREATE TABLE employees (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        phone NVARCHAR(20) NOT NULL UNIQUE,
        salary DECIMAL(10,2) NOT NULL DEFAULT 0,
        commission DECIMAL(5,2) NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      );

      -- Sales table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sales' AND xtype='U')
      CREATE TABLE sales (
        id NVARCHAR(50) PRIMARY KEY,
        invoice_number NVARCHAR(50) NOT NULL UNIQUE,
        total_amount DECIMAL(10,2) NOT NULL,
        employee_id NVARCHAR(50),
        employee_name NVARCHAR(100),
        seller_user NVARCHAR(100),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (employee_id) REFERENCES employees (id)
      );

      -- Sale items table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sale_items' AND xtype='U')
      CREATE TABLE sale_items (
        id NVARCHAR(50) PRIMARY KEY,
        sale_id NVARCHAR(50) NOT NULL,
        product_id NVARCHAR(50) NOT NULL,
        product_name NVARCHAR(100) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      );

      -- Purchase invoices table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='purchase_invoices' AND xtype='U')
      CREATE TABLE purchase_invoices (
        id NVARCHAR(50) PRIMARY KEY,
        invoice_number NVARCHAR(50) NOT NULL UNIQUE,
        supplier_name NVARCHAR(100) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      );

      -- Purchase items table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='purchase_items' AND xtype='U')
      CREATE TABLE purchase_items (
        id NVARCHAR(50) PRIMARY KEY,
        purchase_id NVARCHAR(50) NOT NULL,
        product_id NVARCHAR(50) NOT NULL,
        product_name NVARCHAR(100) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (purchase_id) REFERENCES purchase_invoices (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      );

      -- Users table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id NVARCHAR(50) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        email NVARCHAR(100) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee', 'manager')),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      );
    `;

    await pool.request().query(createTablesSQL);

    // Insert default data
    await insertDefaultData();

    console.log("✅ Database tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error.message);
    throw error;
  }
};

const insertDefaultData = async () => {
  try {
    // Check if default categories exist
    const categoryCheck = await pool
      .request()
      .query("SELECT COUNT(*) as count FROM categories");
    if (categoryCheck.recordset[0].count === 0) {
      console.log("📂 Inserting default categories (first time setup)");
      await pool.request().query(`
        INSERT INTO categories (id, name, color) VALUES 
          ('1', 'مشروبات', '#3B82F6'),
          ('2', 'وجبات خفيفة', '#10B981'),
          ('3', 'حلويات', '#F59E0B');
      `);
    } else {
      console.log(
        "📂 Categories already exist, skipping default category insertion"
      );
    }

    // Check if default products exist - only insert if no products exist at all
    const productCheck = await pool
      .request()
      .query("SELECT COUNT(*) as count FROM products");
    if (productCheck.recordset[0].count === 0) {
      // Only insert default products if the database is completely empty
      // This prevents adding products every time the server restarts
      console.log("📦 Inserting default products (first time setup)");
      await pool.request().query(`
        INSERT INTO products (id, name, price, barcode, category_id) VALUES 
          ('1', 'كوكا كولا', 2.5, '12345', '1'),
          ('2', 'شيبس', 1.5, '67890', '2'),
          ('3', 'شوكولاتة', 3.0, '11111', '3'),
          ('4', 'عصير برتقال', 4.0, '22222', '1');
      `);
    } else {
      console.log(
        "📦 Products already exist, skipping default product insertion"
      );
    }

    // Check if default users exist
    const userCheck = await pool
      .request()
      .query("SELECT COUNT(*) as count FROM users");
    if (userCheck.recordset[0].count === 0) {
      console.log("👥 Inserting default users (first time setup)");
      // Hash passwords before inserting
      const bcrypt = require("bcrypt");
      const adminPassword = await bcrypt.hash("admin123", 10);
      const employeePassword = await bcrypt.hash("password123", 10);
      const managerPassword = await bcrypt.hash("password123", 10);

      await pool.request().query(`
        INSERT INTO users (id, username, email, password, role) VALUES 
          ('1', 'admin', 'admin@barber.com', '${adminPassword}', 'admin'),
          ('2', 'employee', 'employee@barber.com', '${employeePassword}', 'employee'),
          ('3', 'manager', 'manager@barber.com', '${managerPassword}', 'manager');
      `);
    } else {
      console.log("👥 Users already exist, skipping default user insertion");
    }

    console.log("✅ Default data inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting default data:", error.message);
    // Don't throw error for default data insertion
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return pool;
};

const closeDB = async () => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log("✅ Database connection closed");
  }
};

module.exports = {
  connectDB,
  getPool,
  closeDB,
  sql,
};
