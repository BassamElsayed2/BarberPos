const { connectDB, getPool } = require("./config/database");

async function fixDatabase() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    const pool = getPool();

    console.log("Checking for unique constraints on products table...");

    // Check for unique constraints on products table
    const constraints = await pool.request().query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_name = 'products'
    `);

    console.log("Found constraints:", constraints.recordset);

    // Drop any unique constraints on products table
    for (const constraint of constraints.recordset) {
      console.log(`Dropping constraint: ${constraint.constraint_name}`);
      await pool.request().query(`
        ALTER TABLE products DROP CONSTRAINT ${constraint.constraint_name}
      `);
    }

    console.log("✅ Database constraints fixed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing database:", error.message);
    process.exit(1);
  }
}

fixDatabase();
