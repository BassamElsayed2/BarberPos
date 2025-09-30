const { connectDB, getPool } = require("./config/database");

async function fixForeignKeys() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    const pool = getPool();

    console.log("Checking for foreign key constraints on sale_items table...");

    // Check for foreign key constraints on sale_items table
    const constraints = await pool.request().query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'sale_items'
    `);

    console.log("Found foreign key constraints:", constraints.recordset);

    // Drop foreign key constraints on sale_items table
    for (const constraint of constraints.recordset) {
      console.log(
        `Dropping foreign key constraint: ${constraint.constraint_name}`
      );
      await pool.request().query(`
        ALTER TABLE sale_items DROP CONSTRAINT ${constraint.constraint_name}
      `);
    }

    console.log("✅ Foreign key constraints fixed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing foreign key constraints:", error.message);
    process.exit(1);
  }
}

fixForeignKeys();
